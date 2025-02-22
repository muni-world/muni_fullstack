"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const serviceAccountKey_json_1 = __importDefault(require("../serviceAccountKey.json"));
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)({
        projectId: serviceAccountKey_json_1.default.project_id,
        clientEmail: serviceAccountKey_json_1.default.client_email,
        privateKey: serviceAccountKey_json_1.default.private_key,
    }),
});
exports.db = (0, firestore_1.getFirestore)();
//# sourceMappingURL=firebase-config.js.map