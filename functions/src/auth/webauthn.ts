import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

// We store webauthn data in Firestore under "users/{userId}/webauthn" or a global "passkeys" collection.
// To login, we need to find the user by their email or directly prompt with no username if supported.
// Let's use a "users" collection.

export const generateRegistrationOptionsFn = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated to register a passkey.");
  }

  const userId = request.auth.uid;
  const user = await admin.auth().getUser(userId);

  const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;

  // Find existing credentials to exclude them
  const credentialsSnap = await admin.firestore().collection("users").doc(userId).collection("passkeys").get();
  const excludeCredentials = credentialsSnap.docs.map((doc) => ({
    id: doc.id,
    type: "public-key" as const,
  }));

  const options = await generateRegistrationOptions({
    rpName: "Meu Cofrin",
    rpID,
    userID: new Uint8Array(Buffer.from(userId)),
    userName: user.email || userId,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Save challenge to verify later
  await admin.firestore().collection("users").doc(userId).set({
    currentChallenge: options.challenge
  }, { merge: true });

  return options;
});

export const verifyRegistrationResponseFn = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userId = request.auth.uid;
  const response = request.data.response;

  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const expectedChallenge = userDoc.data()?.currentChallenge;

  if (!expectedChallenge) {
    throw new HttpsError("failed-precondition", "No challenge found.");
  }

  const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;
  const origin = request.rawRequest.headers.origin || "http://localhost:4200";

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error: any) {
    throw new HttpsError("invalid-argument", error.message);
  }

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;

    // Save the credential
    const credentialIdBase64url = credential.id;

    await admin.firestore().collection("users").doc(userId).collection("passkeys").doc(credentialIdBase64url).set({
      publicKey: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      transports: credential.transports || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Clear challenge
    await admin.firestore().collection("users").doc(userId).update({
      currentChallenge: admin.firestore.FieldValue.delete()
    });

    return { success: true };
  }

  return { success: false };
});

export const generateAuthenticationOptionsFn = onCall(async (request) => {
  // To authenticate, we either need the email (to lookup the user's credentials)
  // or we do discoverable credentials (passkeys).
  const email = request.data.email;
  if (!email) {
    throw new HttpsError("invalid-argument", "Email is required.");
  }

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (error) {
    throw new HttpsError("not-found", "User not found.");
  }

  const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;

  // Get user credentials
  const credentialsSnap = await admin.firestore().collection("users").doc(user.uid).collection("passkeys").get();
  const allowCredentials = credentialsSnap.docs.map((doc) => ({
    id: doc.id,
    type: "public-key" as const,
    transports: doc.data().transports,
  }));

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  } as any);

  await admin.firestore().collection("users").doc(user.uid).set({
    currentChallenge: options.challenge
  }, { merge: true });

  return options;
});

export const verifyAuthenticationResponseFn = onCall(async (request) => {
  const email = request.data.email;
  const response = request.data.response;

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (error) {
    throw new HttpsError("not-found", "User not found.");
  }

  const userDoc = await admin.firestore().collection("users").doc(user.uid).get();
  const expectedChallenge = userDoc.data()?.currentChallenge;

  if (!expectedChallenge) {
    throw new HttpsError("failed-precondition", "No challenge found.");
  }

  const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;
  const origin = request.rawRequest.headers.origin || "http://localhost:4200";

  const credentialIdBase64url = response.id;
  const credDoc = await admin.firestore().collection("users").doc(user.uid).collection("passkeys").doc(credentialIdBase64url).get();

  if (!credDoc.exists) {
    throw new HttpsError("not-found", "Credential not found.");
  }

  const credData = credDoc.data()!;

  // Verify
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credentialIdBase64url,
        publicKey: new Uint8Array(Buffer.from(credData.publicKey, 'base64')),
        counter: credData.counter,
        transports: credData.transports,
      }
    });
  } catch (error: any) {
    throw new HttpsError("invalid-argument", error.message);
  }

  if (verification.verified && verification.authenticationInfo) {
    // Update counter
    await credDoc.ref.update({
      counter: verification.authenticationInfo.newCounter
    });

    // Clear challenge
    await admin.firestore().collection("users").doc(user.uid).update({
      currentChallenge: admin.firestore.FieldValue.delete()
    });

    // Create Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(user.uid);
    return { token: customToken };
  }

  return { verified: false };
});
