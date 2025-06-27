/**
 * @author      Gabriel Oliveira
 * @version     1.0
 * @since
 */

/** AUXILIARES GLOBAIS */
const codForm = ProcessData.processId,
    codVersao = ProcessData.version,
    codProcesso = ProcessData.processInstanceId,
    codEtapa = ProcessData.activityInstanceId,
    codCiclo = ProcessData.cycle,
    statusProcesso = ProcessData.status;

/** ETAPAS DO PROCESSO */
const SOLICITACAO = codEtapa == 1,
    ANALISAR_SOLICITACAO = codEtapa == 2,
    ASSUMIR_SOLICITACAO = codEtapa == 3,
    CANCELAR = codEtapa == 5,
    FINALIZAR = codEtapa == 4;

/** INICIALIZACAO DO DOCUMENTO */
$(document).ready(function () {
    initForm();

    if (statusProcesso == "A") setEvents();

    Form.apply().then(function () {
        initLayout();
    });
});

/*
 * INICIALIZA FORMULARIO
 */
function initForm() {
    Form.apply();
}

/*
 * INICIALIZA EVENTOS NO FORMULARIO
 */
function setEvents() {
    Form.apply();
}

/* *******************************************************************************************************
 *                                                     ETAPAS                                           *
 * *******************************************************************************************************/

function setSolicitacao() {
    Form.apply();
}

function setAnalisarSolicitacao() {
    Form.apply();
}

/* *******************************************************************************************************
 *                                            ALTERAÇOES ADICIONAIS                                      *
 * *******************************************************************************************************/

function initLayout() {
    let groupsId = Form.groups().map(function (group) {
        return group._id;
    });

    setLogoCabecalho();
    setColorGroupName(groupsId);
    setColorGroupBorder(groupsId);
    setColorBtnAprovar();
    setColorBtnGrid();

    criarInterfaceQRCode(); // QR Code atualizado com 3 parâmetros
}

function validarGrid(nomeGrid) {
    if (Form.grids(nomeGrid).dataRows().length == 0) {
        Form.grids(nomeGrid).errors("GRID DE PREENCHIMENTO OBRIGATÓRIO.");
        return false;
    } else {
        Form.grids(nomeGrid).errors("");
        return true;
    }
}

function controlButtons(esconderAprovar, labelAprovar, esconderRejeicao, labelRejeicao) {
    if (labelAprovar) {
        Form.actions("aprovar").hidden(esconderAprovar).label(labelAprovar).apply();
    } else {
        Form.actions("aprovar").hidden(esconderAprovar).apply();
    }

    if (labelRejeicao) {
        Form.actions("rejeitar").hidden(esconderRejeicao).label(labelRejeicao).apply();
    } else {
        Form.actions("rejeitar").hidden(esconderRejeicao).apply();
    }

    Form.apply().then(() => setColorBtnAprovar());
}

/* *******************************************************************************************************
 *                                            API'S                                                      *
 * *******************************************************************************************************/

function obterCliente(cpfCnpj) {
    ApiCredicom.getClientes(cpfCnpj, function (response) {
        if (response.status === "Sucesso") {
            const content = response.content[0];
            getForm("NOM_COOPERADO").disabled(true).value(content.Cliente).apply();
            getForm("CPF_OU_CNPJ").errors("").apply();
        } else {
            getForm("CPF_OU_CNPJ").errors("CPF/CNPJ INVÁLIDO OU NÃO ENCONTRADO.").apply();
            limparCampo(["NOM_COOPERADO", "LIST_CONTA", "CONTRATOS"], true);
        }
    });
}

function obterContaCorrente(cpfCnpj) {
    ApiCredicom.getContasCorrentes(cpfCnpj, function (response) {
        if (response.status === "Sucesso") {
            const content = response.content;
            const listContaCorrente = content.map((row) => row.numeroContaCorrente + "");
            if (listContaCorrente.length == 1) {
                getForm("LIST_CONTA").disabled(true).value(listContaCorrente[0]).apply();
            } else {
                getForm("LIST_CONTA").disabled(false).addOptions(listContaCorrente, true).apply();
            }
        }
        Form.apply();
    });
}

function carregarScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
        document.head.appendChild(script);
    });
}

/* *******************************************************************************************************
 *                                    INTERFACE QR CODE (COM codProcesso, codEtapa, codCiclo)            *
 * *******************************************************************************************************/

function criarInterfaceQRCode() {
    const urlScriptQRCode = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";

    carregarScript(urlScriptQRCode)
        .then(() => {
            const codProcesso = ProcessData.processInstanceId;
            const codEtapa = ProcessData.activityInstanceId;
            const codCiclo = ProcessData.cycle;

            const url = `${location.origin}/bpm/upload/cadastros/apps/qrcode_imagem/public/celular.html?codProcesso=${codProcesso}&codEtapa=${codEtapa}&codCiclo=${codCiclo}`;

            const container = document.createElement("div");
            Object.assign(container.style, {
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgb(0 0 0 / 0.15)",
                textAlign: "center",
                maxWidth: "320px",
                margin: "20px auto"
            });

            const titulo = document.createElement("h2");
            titulo.textContent = "Envio de Foto via QR Code";
            Object.assign(titulo.style, {
                fontSize: "1.5rem",
                marginBottom: "16px",
                color: "#1f2937"
            });
            container.appendChild(titulo);

            const btnGerar = document.createElement("button");
            btnGerar.id = "btnGerar";
            btnGerar.textContent = "Gerar QR Code";
            Object.assign(btnGerar.style, {
                backgroundColor: "#16a34a",
                color: "white",
                padding: "10px 24px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "background-color 0.3s ease"
            });
            btnGerar.onmouseover = () => (btnGerar.style.backgroundColor = "#15803d");
            btnGerar.onmouseout = () => (btnGerar.style.backgroundColor = "#16a34a");
            container.appendChild(btnGerar);

            const divResultado = document.createElement("div");
            divResultado.id = "resultado";
            divResultado.style.marginTop = "20px";
            divResultado.style.display = "none";
            container.appendChild(divResultado);

            const canvasQRCode = document.createElement("canvas");
            canvasQRCode.id = "qrcode";
            canvasQRCode.style.margin = "0 auto 16px auto";
            divResultado.appendChild(canvasQRCode);

            const btnAbrirLink = document.createElement("button");
            btnAbrirLink.id = "abrirLink";
            btnAbrirLink.textContent = "Abrir no celular";
            Object.assign(btnAbrirLink.style, {
                backgroundColor: "#2563eb",
                color: "white",
                padding: "10px 24px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "background-color 0.3s ease"
            });
            btnAbrirLink.onmouseover = () => (btnAbrirLink.style.backgroundColor = "#1d4ed8");
            btnAbrirLink.onmouseout = () => (btnAbrirLink.style.backgroundColor = "#2563eb");
            divResultado.appendChild(btnAbrirLink);

            document.body.appendChild(container);

            btnGerar.onclick = () => {
                QRCode.toCanvas(canvasQRCode, url, (error) => {
                    if (error) {
                        console.error(error);
                        alert("Erro ao gerar QR Code");
                        return;
                    }
                    divResultado.style.display = "block";
                });
            };

            btnAbrirLink.onclick = () => {
                window.open(url, "_blank");
            };
        })
        .catch((err) => {
            console.error(err);
            alert("Erro ao carregar a biblioteca QRCode.");
        });
}
