import { doc, setDoc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// Limite seguro por documento do Firestore (1MB máximo absoluto, paramos em 800KB)
const CHUNK_SIZE = 800 * 1024; 

export const saveChunkedProfilePic = async (user: string, base64Data: string) => {
  const numChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
  
  // 1. Salvar os pedaços (Chunks)
  for (let i = 0; i < numChunks; i++) {
    const chunkData = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, "profile_pics_chunks", `${user}_chunk_${i}`), {
      data: chunkData
    });
  }
  
  // 2. Atualizar o manifesto (Sinaliza que terminou)
  await setDoc(doc(db, "profile_pics_meta", user), {
    chunks: numChunks,
    updatedAt: Date.now()
  });
};

export const subscribeToChunkedProfilePics = (onUpdate: (pics: Record<string, string>) => void) => {
  // Observa mudanças no manifesto de QUALQUER usuário
  return onSnapshot(collection(db, "profile_pics_meta"), async (snapshot) => {
    const nextPics: Record<string, string> = {};
    
    for (const docSnapshot of snapshot.docs) {
      const user = docSnapshot.id;
      const meta = docSnapshot.data();
      
      try {
        let fullBase64 = "";
        for (let i = 0; i < meta.chunks; i++) {
          const chunkSnapshot = await getDoc(doc(db, "profile_pics_chunks", `${user}_chunk_${i}`));
          if (chunkSnapshot.exists()) {
            fullBase64 += chunkSnapshot.data().data;
          }
        }
        if (fullBase64) {
          nextPics[user] = fullBase64;
        }
      } catch (e) {
        console.error(`Erro ao recriar chunk do usuário ${user}`, e);
      }
    }
    
    if (Object.keys(nextPics).length > 0) {
      onUpdate(nextPics);
    }
  });
};
