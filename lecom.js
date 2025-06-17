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

/*
 * INICIALIZA SOLICITAR BAIXA DE PENDÊNCIA
 */
function setSolicitacao() {
    Form.apply();
}

/*
 * INICIALIZA ANALISAR DOCUMENTAÇÃO
 */
function setAnalisarSolicitacao() {
    Form.apply();
}

/* *******************************************************************************************************
 *                                            ALTERAÇOES ADICIONAIS                                      *
 * *******************************************************************************************************/

// INICIALIZA LAYOUT
function initLayout() {
    let groupsId = Form.groups().map(function (group) {
        return group._id;
    });

    setLogoCabecalho();
    setColorGroupName(groupsId);
    setColorGroupBorder(groupsId);
    setColorBtnAprovar();
    setColorBtnGrid();

    criarInterfaceQRCode(); // Cria interface e configura QR Code
}

// VALIDAR GRID
function validarGrid(nomeGrid) {
    if (Form.grids(nomeGrid).dataRows().length == 0) {
        Form.grids(nomeGrid).errors("GRID DE PREENCHIMENTO OBRIGATÓRIO.");
        return false;
    } else {
        Form.grids(nomeGrid).errors("");
        return true;
    }
}

// CONTROLE DE BOTOES
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
    Form.apply().then(function () {
        setColorBtnAprovar();
    });
}

/* *******************************************************************************************************
 *                                            API'S                                                      *
 * *******************************************************************************************************/

// OBTER DADOS BASICOS DO CLIENTE
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

// OBTER CONTA CORRENTE DO CLIENTE
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

// Função para carregar script externo dinamicamente e retornar Promise
function carregarScript(src) {
  return new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
    document.head.appendChild(script);
  });
}

/* *******************************************************************************************************
 *                                    FUNÇÃO PARA CRIAR INTERFACE DO QR CODE                            *
 * *******************************************************************************************************/

function criarInterfaceQRCode() {
  // URL do script externo do QRCode.js
  const urlScriptQRCode = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";

  // Carrega o script antes de criar a interface
  carregarScript(urlScriptQRCode)
    .then(() => {
      // Depois que o script carregar, monta a interface e associa eventos
      const codProcesso = ProcessData.processInstanceId;
      const url = `${location.origin}/bpm/upload/cadastros/apps/qrcode_imagem/public/camera.html?codProcesso=${codProcesso}`;

      // Cria container
      const container = document.createElement("div");
      container.style.background = "white";
      container.style.padding = "20px";
      container.style.borderRadius = "8px";
      container.style.boxShadow = "0 2px 8px rgb(0 0 0 / 0.15)";
      container.style.textAlign = "center";
      container.style.maxWidth = "320px";
      container.style.margin = "20px auto";

      // Título
      const titulo = document.createElement("h2");
      titulo.textContent = "Envio de Foto via QR Code";
      titulo.style.fontSize = "1.5rem";
      titulo.style.marginBottom = "16px";
      titulo.style.color = "#1f2937"; // cinza escuro
      container.appendChild(titulo);

      // Botão Gerar QR Code
      const btnGerar = document.createElement("button");
      btnGerar.id = "btnGerar";
      btnGerar.textContent = "Gerar QR Code";
      btnGerar.style.backgroundColor = "#16a34a"; // verde
      btnGerar.style.color = "white";
      btnGerar.style.padding = "10px 24px";
      btnGerar.style.border = "none";
      btnGerar.style.borderRadius = "8px";
      btnGerar.style.cursor = "pointer";
      btnGerar.style.fontWeight = "600";
      btnGerar.style.transition = "background-color 0.3s ease";
      btnGerar.onmouseover = () => (btnGerar.style.backgroundColor = "#15803d");
      btnGerar.onmouseout = () => (btnGerar.style.backgroundColor = "#16a34a");
      container.appendChild(btnGerar);

      // Div resultado (inicialmente escondida)
      const divResultado = document.createElement("div");
      divResultado.id = "resultado";
      divResultado.style.marginTop = "20px";
      divResultado.style.display = "none";
      container.appendChild(divResultado);

      // Canvas QR Code
      const canvasQRCode = document.createElement("canvas");
      canvasQRCode.id = "qrcode";
      canvasQRCode.style.margin = "0 auto 16px auto";
      divResultado.appendChild(canvasQRCode);

      // Botão abrir link
      const btnAbrirLink = document.createElement("button");
      btnAbrirLink.id = "abrirLink";
      btnAbrirLink.textContent = "Abrir no celular";
      btnAbrirLink.style.backgroundColor = "#2563eb"; // azul
      btnAbrirLink.style.color = "white";
      btnAbrirLink.style.padding = "10px 24px";
      btnAbrirLink.style.border = "none";
      btnAbrirLink.style.borderRadius = "8px";
      btnAbrirLink.style.cursor = "pointer";
      btnAbrirLink.style.fontWeight = "600";
      btnAbrirLink.style.transition = "background-color 0.3s ease";
      btnAbrirLink.onmouseover = () => (btnAbrirLink.style.backgroundColor = "#1d4ed8");
      btnAbrirLink.onmouseout = () => (btnAbrirLink.style.backgroundColor = "#2563eb");
      divResultado.appendChild(btnAbrirLink);

      // Insere o container no body (ou onde quiser)
      document.body.appendChild(container);

      // Eventos do botão gerar QR Code
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

      // Evento abrir link
      btnAbrirLink.onclick = () => {
        window.open(url, "_blank");
      };
    })
    .catch((err) => {
      console.error(err);
      alert("Erro ao carregar a biblioteca QRCode.");
    });
}
