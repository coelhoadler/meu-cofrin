"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthenticationResponseFn = exports.generateAuthenticationOptionsFn = exports.verifyRegistrationResponseFn = exports.generateRegistrationOptionsFn = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const server_1 = require("@simplewebauthn/server");
// We store webauthn data in Firestore under "users/{userId}/webauthn" or a global "passkeys" collection.
// To login, we need to find the user by their email or directly prompt with no username if supported.
// Let's use a "users" collection.
exports.generateRegistrationOptionsFn = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to register a passkey.");
    }
    const userId = request.auth.uid;
    const user = await admin.auth().getUser(userId);
    const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;
    // Find existing credentials to exclude them
    const credentialsSnap = await admin.firestore().collection("users").doc(userId).collection("passkeys").get();
    const excludeCredentials = credentialsSnap.docs.map((doc) => ({
        id: doc.id,
        type: "public-key",
    }));
    const options = await (0, server_1.generateRegistrationOptions)({
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
exports.verifyRegistrationResponseFn = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const userId = request.auth.uid;
    const response = request.data.response;
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const expectedChallenge = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.currentChallenge;
    if (!expectedChallenge) {
        throw new https_1.HttpsError("failed-precondition", "No challenge found.");
    }
    const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;
    const origin = request.rawRequest.headers.origin || "http://localhost:4200";
    let verification;
    try {
        verification = await (0, server_1.verifyRegistrationResponse)({
            response,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
    }
    catch (error) {
        throw new https_1.HttpsError("invalid-argument", error.message);
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
exports.generateAuthenticationOptionsFn = (0, https_1.onCall)(async (request) => {
    // To authenticate, we either need the email (to lookup the user's credentials)
    // or we do discoverable credentials (passkeys).
    const email = request.data.email;
    if (!email) {
        throw new https_1.HttpsError("invalid-argument", "Email is required.");
    }
    let user;
    try {
        user = await admin.auth().getUserByEmail(email);
    }
    catch (error) {
        throw new https_1.HttpsError("not-found", "User not found.");
    }
    const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;
    // Get user credentials
    const credentialsSnap = await admin.firestore().collection("users").doc(user.uid).collection("passkeys").get();
    const allowCredentials = credentialsSnap.docs.map((doc) => ({
        id: Buffer.from(doc.id, 'base64url'),
        type: "public-key",
        transports: doc.data().transports,
    }));
    const options = await (0, server_1.generateAuthenticationOptions)({
        rpID,
        allowCredentials,
        userVerification: "preferred",
    });
    await admin.firestore().collection("users").doc(user.uid).set({
        currentChallenge: options.challenge
    }, { merge: true });
    return options;
});
exports.verifyAuthenticationResponseFn = (0, https_1.onCall)(async (request) => {
    var _a;
    const email = request.data.email;
    const response = request.data.response;
    let user;
    try {
        user = await admin.auth().getUserByEmail(email);
    }
    catch (error) {
        throw new https_1.HttpsError("not-found", "User not found.");
    }
    const userDoc = await admin.firestore().collection("users").doc(user.uid).get();
    const expectedChallenge = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.currentChallenge;
    if (!expectedChallenge) {
        throw new https_1.HttpsError("failed-precondition", "No challenge found.");
    }
    const rpID = new URL(request.rawRequest.headers.origin || "http://localhost:4200").hostname;
    const origin = request.rawRequest.headers.origin || "http://localhost:4200";
    const credentialIdBase64url = response.id;
    const credDoc = await admin.firestore().collection("users").doc(user.uid).collection("passkeys").doc(credentialIdBase64url).get();
    if (!credDoc.exists) {
        throw new https_1.HttpsError("not-found", "Credential not found.");
    }
    const credData = credDoc.data();
    // Verify
    let verification;
    try {
        verification = await (0, server_1.verifyAuthenticationResponse)({
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
    }
    catch (error) {
        throw new https_1.HttpsError("invalid-argument", error.message);
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
//# sourceMappingURL=webauthn.js.map