// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const fs = require("fs-extra");
// const path = require("path");

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.json());

// // Pasta de upload
// const uploadDir = path.join(__dirname, "upload");
// fs.ensureDirSync(uploadDir);

// // Multer config para salvar com nome customizado
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const cod = req.body.codProcesso || "UNKNOWN";
//     const timestamp = Date.now();
//     cb(null, `CodProcesso$${cod}_${timestamp}${path.extname(file.originalname)}`);
//   },
// });
// const upload = multer({ storage });

// /**
//  * Rota para upload de imagem
//  * Exemplo de uso: POST /upload
//  * Body: FormData com campo "image" e "codProcesso"
//  */
// app.post("/upload", upload.single("image"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "Nenhum arquivo enviado." });
//   }
//   res.json({ message: "Imagem recebida com sucesso!", file: req.file.filename });
// });

// /**
//  * Rota para listar imagens de um CodProcesso
//  * Exemplo de uso: GET /imagens/123
//  */
// app.get("/imagens/:codProcesso", async (req, res) => {
//   const cod = req.params.codProcesso;
//   try {
//     const files = await fs.readdir(uploadDir);
//     const imagens = files.filter(f => f.startsWith(`CodProcesso$${cod}_`));
//     res.json(imagens);
//   } catch (err) {
//     res.status(500).json({ error: "Erro ao ler arquivos." });
//   }
// });

// /**
//  * Rota para deletar imagens de um CodProcesso
//  * Exemplo de uso: DELETE /imagens/123
//  */
// app.delete("/imagens/:codProcesso", async (req, res) => {
//   const cod = req.params.codProcesso;
//   try {
//     const files = await fs.readdir(uploadDir);
//     const arquivosParaExcluir = files.filter(f => f.startsWith(`CodProcesso$${cod}_`));

//     await Promise.all(
//       arquivosParaExcluir.map(nome => fs.remove(path.join(uploadDir, nome)))
//     );

//     res.json({ message: `Imagens do processo ${cod} excluídas com sucesso.` });
//   } catch (err) {
//     res.status(500).json({ error: "Erro ao excluir imagens." });
//   }
// });

// /**
//  * Servir imagens estaticamente
//  * Exemplo de uso: http://localhost:3000/upload/CodProcesso$123_999999.jpg
//  */
// app.use(express.static(path.join(__dirname, "public")));

// app.listen(PORT, () => {
//   console.log(`Servidor rodando em http://localhost:${PORT}`);
// });


const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();

// Porta definida pelo ambiente ou fallback para 3000
const PORT = process.env.PORT || 3000;

// Caminho base no servidor (Lecom está em /bpm/upload/cadastros/apps/qrcode_imagem/)
const BASE_PATH = "/bpm/upload/cadastros/apps/qrcode_imagem";

// CORS para liberar acesso do BPM
app.use(cors({ origin: "*" }));
app.use(express.json());

// Diretório de upload
const uploadDir = path.join(__dirname, "upload");
fs.ensureDirSync(uploadDir);

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const cod = req.body.codProcesso || "UNKNOWN";
    const timestamp = Date.now();
    cb(null, `CodProcesso$${cod}_${timestamp}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Rotas

// Upload
app.post(`${BASE_PATH}/upload`, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
  res.json({ message: "Imagem recebida com sucesso!", file: req.file.filename });
});

// Listar imagens
app.get(`${BASE_PATH}/imagens/:codProcesso`, async (req, res) => {
  const cod = req.params.codProcesso;
  try {
    const files = await fs.readdir(uploadDir);
    const imagens = files.filter(f => f.startsWith(`CodProcesso$${cod}_`));
    res.json(imagens);
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivos." });
  }
});

// Deletar imagens
app.delete(`${BASE_PATH}/imagens/:codProcesso`, async (req, res) => {
  const cod = req.params.codProcesso;
  try {
    const files = await fs.readdir(uploadDir);
    const arquivosParaExcluir = files.filter(f => f.startsWith(`CodProcesso$${cod}_`));
    await Promise.all(arquivosParaExcluir.map(nome => fs.remove(path.join(uploadDir, nome))));
    res.json({ message: `Imagens do processo ${cod} excluídas com sucesso.` });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir imagens." });
  }
});

// Servir HTML e arquivos públicos
app.use(BASE_PATH, express.static(path.join(__dirname, "public")));

// Start
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}${BASE_PATH}`);
});
