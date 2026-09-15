import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { Desejo, DesejoLink } from '../models/desejo.model';

@Injectable({
  providedIn: 'root'
})
export class DesejoService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  private calculatePrecos(links: DesejoLink[]): { menorPreco: number | null; maiorPreco: number | null } {
    if (!links || links.length === 0) {
      return { menorPreco: null, maiorPreco: null };
    }
    const precosValidos = links
      .map(l => Number(l.preco))
      .filter(p => !isNaN(p) && p >= 0);

    if (precosValidos.length === 0) {
      return { menorPreco: null, maiorPreco: null };
    }

    return {
      menorPreco: Math.min(...precosValidos),
      maiorPreco: Math.max(...precosValidos)
    };
  }

  async uploadImagem(uid: string, file: File): Promise<{ downloadUrl: string; storagePath: string }> {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${uid}/desejos/${timestamp}_${cleanName}`;
    const storageRef = ref(this.storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { downloadUrl, storagePath };
  }

  async deleteImagem(storagePathOrUrl: string): Promise<void> {
    if (!storagePathOrUrl) return;
    try {
      const fileRef = ref(this.storage, storagePathOrUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn('Erro ao deletar imagem do Storage:', error);
    }
  }

  async getDesejos(): Promise<Desejo[]> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return [];

    const desejosRef = collection(this.firestore, `users/${user.uid}/desejos`);
    const q = query(desejosRef, orderBy('criadoEm', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data
      } as Desejo;
    });
  }

  async getDesejoById(id: string): Promise<Desejo | null> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return null;

    const docRef = doc(this.firestore, `users/${user.uid}/desejos`, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Desejo;
  }

  async addDesejo(
    desejoData: Omit<Desejo, 'id' | 'criadoEm' | 'atualizadoEm' | 'links' | 'menorPreco' | 'maiorPreco'>,
    file?: File | null
  ): Promise<string> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    let imagemUrl = desejoData.imagemUrl || '';
    let imagemPath = desejoData.imagemPath || '';

    if (file) {
      const uploadRes = await this.uploadImagem(user.uid, file);
      imagemUrl = uploadRes.downloadUrl;
      imagemPath = uploadRes.storagePath;
    }

    const dataToSave = {
      ...desejoData,
      imagemUrl,
      imagemPath,
      links: [],
      menorPreco: null,
      maiorPreco: null,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    };

    const desejosRef = collection(this.firestore, `users/${user.uid}/desejos`);
    const docRef = await addDoc(desejosRef, dataToSave);
    return docRef.id;
  }

  async updateDesejo(id: string, desejoData: Partial<Desejo>, newFile?: File | null): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/desejos`, id);
    const updateData: any = {
      ...desejoData,
      atualizadoEm: serverTimestamp()
    };
    delete updateData.id;

    if (newFile) {
      // Se houver arquivo anterior, removemos
      if (desejoData.imagemPath) {
        await this.deleteImagem(desejoData.imagemPath);
      }
      const uploadRes = await this.uploadImagem(user.uid, newFile);
      updateData.imagemUrl = uploadRes.downloadUrl;
      updateData.imagemPath = uploadRes.storagePath;
    }

    await updateDoc(docRef, updateData);
  }

  async deleteDesejo(id: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/desejos`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Desejo;
      if (data.imagemPath) {
        await this.deleteImagem(data.imagemPath);
      }
    }

    await deleteDoc(docRef);
  }

  async addLink(desejoId: string, linkData: Omit<DesejoLink, 'id' | 'criadoEm'>): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/desejos`, desejoId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Desejo não encontrado');

    const desejo = docSnap.data() as Desejo;
    const links = [...(desejo.links || [])];

    const newLink: DesejoLink = {
      ...linkData,
      id: crypto.randomUUID ? crypto.randomUUID() : `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      criadoEm: new Date().toISOString()
    };

    links.push(newLink);

    const { menorPreco, maiorPreco } = this.calculatePrecos(links);

    await updateDoc(docRef, {
      links,
      menorPreco,
      maiorPreco,
      atualizadoEm: serverTimestamp()
    });
  }

  async updateLink(desejoId: string, linkId: string, linkData: Partial<DesejoLink>): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/desejos`, desejoId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Desejo não encontrado');

    const desejo = docSnap.data() as Desejo;
    const links = (desejo.links || []).map(link => {
      if (link.id === linkId) {
        return {
          ...link,
          ...linkData,
          preco: linkData.preco !== undefined ? Number(linkData.preco) : link.preco
        };
      }
      return link;
    });

    const { menorPreco, maiorPreco } = this.calculatePrecos(links);

    await updateDoc(docRef, {
      links,
      menorPreco,
      maiorPreco,
      atualizadoEm: serverTimestamp()
    });
  }

  async removeLink(desejoId: string, linkId: string): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, `users/${user.uid}/desejos`, desejoId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Desejo não encontrado');

    const desejo = docSnap.data() as Desejo;
    const links = (desejo.links || []).filter(link => link.id !== linkId);

    const { menorPreco, maiorPreco } = this.calculatePrecos(links);

    await updateDoc(docRef, {
      links,
      menorPreco,
      maiorPreco,
      atualizadoEm: serverTimestamp()
    });
  }
}
