import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Investimento, RegistroInvestimento } from '../models/investimento.model';

@Injectable({
  providedIn: 'root'
})
export class InvestimentoService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  async getInvestimentos(): Promise<Investimento[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return [];

    const investimentosRef = collection(this.firestore, `users/${user.uid}/investimentos`);
    const q = query(investimentosRef, orderBy('criadoEm', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Investimento));
  }

  async addInvestimento(investimentoData: Investimento): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const dataToSave = {
      ...investimentoData,
      criadoEm: serverTimestamp()
    };

    const investimentosRef = collection(this.firestore, `users/${user.uid}/investimentos`);
    const docRef = await addDoc(investimentosRef, dataToSave);

    // Cria o primeiro registro de aporte inicial
    if (investimentoData.aporteInicial > 0) {
      const registro: RegistroInvestimento = {
        data: new Date().toISOString(),
        valor: investimentoData.aporteInicial,
        anotacao: 'Aporte inicial'
      };
      const registrosRef = collection(this.firestore, `users/${user.uid}/investimentos/${docRef.id}/registros`);
      await addDoc(registrosRef, registro);
    }
  }

  async updateInvestimento(id: string, investimentoData: Partial<Investimento>): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/investimentos`, id);
    const dataToUpdate = { ...investimentoData };
    delete dataToUpdate.id;

    await updateDoc(docRef, dataToUpdate);
  }

  async deleteInvestimento(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    // Idealmente deve deletar os registros (subcoleção) também, mas o Firestore não deleta subcoleções automaticamente pelo cliente web.
    // Vamos apenas deletar o documento principal por enquanto (recomendado usar Cloud Functions para deletar subcoleções, ou deletar um a um se não for grande).
    const docRef = doc(this.firestore, `users/${user.uid}/investimentos`, id);
    await deleteDoc(docRef);
  }

  async getInvestimentoById(id: string): Promise<Investimento | null> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return null;

    const docRef = doc(this.firestore, `users/${user.uid}/investimentos`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Investimento;
    }
    return null;
  }

  async getRegistros(investimentoId: string): Promise<RegistroInvestimento[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return [];

    const registrosRef = collection(this.firestore, `users/${user.uid}/investimentos/${investimentoId}/registros`);
    const q = query(registrosRef, orderBy('data', 'asc')); // Ordem cronológica
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RegistroInvestimento));
  }

  async addRegistro(investimentoId: string, registro: RegistroInvestimento): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const registrosRef = collection(this.firestore, `users/${user.uid}/investimentos/${investimentoId}/registros`);
    await addDoc(registrosRef, registro);

    // Atualiza o valorAtual do investimento
    const investimentoRef = doc(this.firestore, `users/${user.uid}/investimentos`, investimentoId);
    await updateDoc(investimentoRef, { valorAtual: registro.valor });
  }

  async deleteRegistro(investimentoId: string, registroId: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/investimentos/${investimentoId}/registros`, registroId);
    await deleteDoc(docRef);
    
    // Recalcular o valorAtual baseado no último registro restante
    const registrosRestantes = await this.getRegistros(investimentoId);
    let novoValorAtual = 0;

    if (registrosRestantes.length > 0) {
      novoValorAtual = registrosRestantes[registrosRestantes.length - 1].valor;
    } else {
      // Se não sobrou nenhum registro, volta para o aporte inicial
      const investimento = await this.getInvestimentoById(investimentoId);
      if (investimento) {
        novoValorAtual = investimento.aporteInicial;
      }
    }

    const investimentoRef = doc(this.firestore, `users/${user.uid}/investimentos`, investimentoId);
    await updateDoc(investimentoRef, { valorAtual: novoValorAtual });
  }
}
