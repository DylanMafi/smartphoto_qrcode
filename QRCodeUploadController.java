package com.lecom.workflow.cadastros.common.controller;

import static br.com.lecom.api.factory.ECMFactory.documento;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.lecom.tecnologia.db.DBUtils;
import br.com.docsys.ecm.client.dto.document.Document;
import br.com.docsys.ecm.client.dto.file.DocFile;
import br.com.lecom.atos.servicos.annotation.Version;
import br.com.lecom.atos.utils.view.ControllerServlet;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

@WebServlet("/app/qrcode_upload/")
@Version({ 1, 0, 0 })
public class QRCodeUploadController extends ControllerServlet {
    private static final Logger logger = LoggerFactory.getLogger(QRCodeUploadController.class);

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        logger.info("Iniciando processamento de upload via QR Code");
        JSONObject retorno = new JSONObject();

        try {
            if (!ServletFileUpload.isMultipartContent(request)) {
                throw new Exception("Requisição não contém upload multipart");
            }

            DiskFileItemFactory factory = new DiskFileItemFactory();
            ServletFileUpload upload = new ServletFileUpload(factory);

            String codProcesso = null;
            FileItem fileItem = null;

            for (FileItem item : upload.parseRequest(request)) {
                if (item.isFormField()) {
                    if ("codProcesso".equals(item.getFieldName())) {
                        codProcesso = item.getString();
                    }
                } else {
                    if ("imagem".equals(item.getFieldName())) {
                        fileItem = item;
                    }
                }
            }

            if (codProcesso == null || fileItem == null) {
                throw new Exception("Parâmetros obrigatórios não informados");
            }

            Document documento = documento()
                .criarDocumento(fileItem.getInputStream(), fileItem.getName())
                .salvar();

            DocFile arquivoDoc = documento.getCurrentFile();
            String nomeArquivoGerado = arquivoDoc.getFileName();
            String nomeCriptografado = arquivoDoc.getFileUniqueId().getValue();
            String arquivoEcm = nomeArquivoGerado + ":" + nomeCriptografado;

            logger.info("Arquivo recebido: " + nomeArquivoGerado);

            if (inserirNaGrid(codProcesso, arquivoEcm, fileItem.getName())) {
                retorno.put("status", "success");
                retorno.put("mensagem", "Imagem anexada com sucesso");
                retorno.put("arquivo", arquivoEcm);
            } else {
                retorno.put("status", "error");
                retorno.put("mensagem", "Falha ao anexar imagem na grid");
            }

        } catch (Exception e) {
            logger.error("Erro no processamento: " + e.getMessage(), e);
            retorno.put("status", "error");
            retorno.put("mensagem", e.getMessage());
        } finally {
            response.setContentType("application/json");
            response.getWriter().write(retorno.toString());
        }
    }

    private boolean inserirNaGrid(String codProcesso, String arquivoEcm, String nomeOriginal) throws SQLException {
        logger.info("Inserindo na grid para processo: " + codProcesso);

        String sql = "INSERT INTO GRID_ANEXOS (COD_PROCESSO, NOME_ARQUIVO, ARQUIVO_ECM, DATA_UPLOAD) " +
                     "VALUES (?, ?, ?, CURRENT_TIMESTAMP)";

        try (Connection conn = DBUtils.getConnection("workflow");
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, codProcesso);
            pstmt.setString(2, nomeOriginal);
            pstmt.setString(3, arquivoEcm);

            return pstmt.executeUpdate() > 0;
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String codProcesso = request.getParameter("codProcesso");
        JSONArray retorno = new JSONArray();

        if (codProcesso == null) {
            response.sendError(400, "Parâmetro codProcesso obrigatório");
            return;
        }

        try (Connection conn = DBUtils.getConnection("workflow");
             PreparedStatement pstmt = conn.prepareStatement(
                 "SELECT NOME_ARQUIVO, ARQUIVO_ECM FROM GRID_ANEXOS WHERE COD_PROCESSO = ?")) {

            pstmt.setString(1, codProcesso);
            ResultSet rs = pstmt.executeQuery();

            while (rs.next()) {
                JSONObject item = new JSONObject();
                item.put("nome", rs.getString("NOME_ARQUIVO"));
                item.put("ecm", rs.getString("ARQUIVO_ECM"));
                retorno.put(item);
            }

        } catch (Exception e) {
            logger.error("Erro ao listar anexos: " + e.getMessage(), e);
            response.sendError(500, "Erro interno");
            return;
        }

        response.setContentType("application/json");
        response.getWriter().write(retorno.toString());
    }
}
