/**
 * PDF Translator - Estilo Overleaf
 * Aplicação para visualizar PDFs e traduzir textos selecionados
 */

// Configuração do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Estado da aplicação
const state = {
    pdf: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.5,
    isResizing: false,
    selectedText: '',
    translations: []
};

// Elementos DOM
const elements = {
    pdfInput: document.getElementById('pdfInput'),
    pdfCanvas: document.getElementById('pdfCanvas'),
    pdfContainer: document.getElementById('pdfContainer'),
    pdfPlaceholder: document.getElementById('pdfPlaceholder'),
    textLayer: document.getElementById('textLayer'),
    pageInfo: document.getElementById('pageInfo'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomLevel: document.getElementById('zoomLevel'),
    translateBtn: document.getElementById('translateBtn'),
    translationContainer: document.getElementById('translationContainer'),
    translationPlaceholder: document.getElementById('translationPlaceholder'),
    translationContent: document.getElementById('translationContent'),
    clearTranslation: document.getElementById('clearTranslation'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    resizer: document.getElementById('resizer'),
    panelLeft: document.querySelector('.panel-left')
};

// Contexto do canvas
const ctx = elements.pdfCanvas.getContext('2d');

/**
 * Inicialização da aplicação
 */
function init() {
    bindEvents();
    setupResizer();
}

/**
 * Vincula eventos aos elementos
 */
function bindEvents() {
    // Carregar PDF
    elements.pdfInput.addEventListener('change', handleFileSelect);

    // Navegação
    elements.prevPage.addEventListener('click', () => changePage(-1));
    elements.nextPage.addEventListener('click', () => changePage(1));

    // Zoom
    elements.zoomIn.addEventListener('click', () => changeZoom(0.2));
    elements.zoomOut.addEventListener('click', () => changeZoom(-0.2));

    // Tradução
    elements.translateBtn.addEventListener('click', handleTranslate);
    elements.clearTranslation.addEventListener('click', clearTranslations);

    // Seleção de texto
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('selectionchange', debounce(updateTranslateButton, 100));

    // Teclado
    document.addEventListener('keydown', handleKeyboard);
}

/**
 * Configura o redimensionamento de painéis
 */
function setupResizer() {
    const resizer = elements.resizer;
    const panelLeft = elements.panelLeft;

    resizer.addEventListener('mousedown', (e) => {
        state.isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!state.isResizing) return;

        const containerWidth = document.querySelector('.main-content').offsetWidth;
        const newWidth = (e.clientX / containerWidth) * 100;

        if (newWidth >= 20 && newWidth <= 80) {
            panelLeft.style.width = `${newWidth}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (state.isResizing) {
            state.isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Re-renderizar PDF se necessário
            if (state.pdf) {
                renderPage(state.currentPage);
            }
        }
    });
}

/**
 * Manipula a seleção de arquivo PDF
 */
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;

    const arrayBuffer = await file.arrayBuffer();
    await loadPDF(arrayBuffer);
}

/**
 * Carrega o PDF no visualizador
 */
async function loadPDF(arrayBuffer) {
    try {
        state.pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        state.totalPages = state.pdf.numPages;
        state.currentPage = 1;

        elements.pdfPlaceholder.style.display = 'none';
        elements.pdfCanvas.style.display = 'block';
        elements.textLayer.style.display = 'block';

        updatePageInfo();
        await renderPage(1);
    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        alert('Erro ao carregar o PDF. Verifique se o arquivo é válido.');
    }
}

/**
 * Renderiza uma página específica do PDF
 */
async function renderPage(pageNum) {
    if (!state.pdf) return;

    try {
        const page = await state.pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.scale });

        // Configurar canvas
        elements.pdfCanvas.width = viewport.width;
        elements.pdfCanvas.height = viewport.height;

        // Renderizar no canvas
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Configurar text layer para seleção
        await setupTextLayer(page, viewport);

        state.currentPage = pageNum;
        updatePageInfo();
    } catch (error) {
        console.error('Erro ao renderizar página:', error);
    }
}

/**
 * Configura a camada de texto para seleção
 */
async function setupTextLayer(page, viewport) {
    const textContent = await page.getTextContent();
    const textLayer = elements.textLayer;

    // Limpar camada anterior
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    // Criar elementos de texto
    textContent.items.forEach((item) => {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.hypot(tx[0], tx[1]);
        const fontWidth = Math.hypot(tx[2], tx[3]);

        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.left = `${tx[4]}px`;
        span.style.top = `${tx[5] - fontHeight}px`;
        span.style.fontSize = `${fontHeight}px`;
        span.style.fontFamily = item.fontName;
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.style.transform = 'scaleX(1)';

        textLayer.appendChild(span);
    });
}

/**
 * Atualiza a informação da página
 */
function updatePageInfo() {
    elements.pageInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
    elements.prevPage.disabled = state.currentPage <= 1;
    elements.nextPage.disabled = state.currentPage >= state.totalPages;
}

/**
 * Muda de página
 */
function changePage(delta) {
    const newPage = state.currentPage + delta;
    if (newPage >= 1 && newPage <= state.totalPages) {
        renderPage(newPage);
    }
}

/**
 * Altera o nível de zoom
 */
function changeZoom(delta) {
    const newScale = state.scale + delta;
    if (newScale >= 0.5 && newScale <= 3) {
        state.scale = newScale;
        elements.zoomLevel.textContent = `${Math.round(newScale * 100)}%`;
        renderPage(state.currentPage);
    }
}

/**
 * Manipula a seleção de texto
 */
function handleTextSelection(e) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0) {
        state.selectedText = text;
        showTranslateButton(e);
    } else {
        hideTranslateButton();
    }
}

/**
 * Atualiza a posição do botão de traduzir
 */
function updateTranslateButton() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 2) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        positionTranslateButton(rect);
    }
}

/**
 * Mostra o botão de traduzir
 */
function showTranslateButton(e) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    positionTranslateButton(rect);
    elements.translateBtn.classList.remove('hidden');
}

/**
 * Posiciona o botão de traduzir
 */
function positionTranslateButton(rect) {
    const btn = elements.translateBtn;
    const btnWidth = 100;
    const btnHeight = 40;

    let left = rect.left + (rect.width / 2) - (btnWidth / 2);
    let top = rect.top - btnHeight - 10;

    // Ajustar se estiver fora da tela
    if (left < 10) left = 10;
    if (left + btnWidth > window.innerWidth - 10) {
        left = window.innerWidth - btnWidth - 10;
    }
    if (top < 10) top = rect.bottom + 10;

    btn.style.left = `${left}px`;
    btn.style.top = `${top}px`;
}

/**
 * Esconde o botão de traduzir
 */
function hideTranslateButton() {
    elements.translateBtn.classList.add('hidden');
}

/**
 * Manipula o evento de tradução
 */
async function handleTranslate() {
    const text = state.selectedText;
    if (!text) return;

    hideTranslateButton();
    elements.loadingOverlay.classList.remove('hidden');

    try {
        const translatedText = await translateText(text);
        addTranslation(text, translatedText);
    } catch (error) {
        console.error('Erro na tradução:', error);

        // Mesmo em caso de erro, adiciona uma mensagem explicativa
        const errorMessage = `⚠️ Não foi possível traduzir automaticamente.

Erro: ${error.message}

Texto original mantido:
"${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"

💡 Dica: Para tradução automática, edite o arquivo config.js e configure sua API preferida.`;

        addTranslation(text, errorMessage);
    } finally {
        elements.loadingOverlay.classList.add('hidden');
        window.getSelection().removeAllRanges();
    }
}

// Verifica se a configuração foi carregada do config.js, senão usa padrão
const CONFIG = typeof TRANSLATION_CONFIG !== 'undefined' ? TRANSLATION_CONFIG : {
    myMemory: { enabled: true },
    deepl: { enabled: false, apiKey: '' },
    google: { enabled: false, apiKey: '' },
    libreTranslate: { enabled: false, url: 'http://localhost:5000/translate', apiKey: '' }
};

/**
 * Traduz o texto usando APIs disponíveis
 */
async function translateText(text) {
    const sourceLang = await detectLanguage(text);
    const targetLang = 'PT'; // Português

    // Tentar MyMemory primeiro (mais acessível)
    if (CONFIG.myMemory.enabled) {
        try {
            return await translateWithMyMemory(text, sourceLang, targetLang);
        } catch (error) {
            console.warn('MyMemory falhou, tentando fallback:', error);
        }
    }

    // Se tiver DeepL configurado, tentar
    if (CONFIG.deepl?.enabled && CONFIG.deepl?.apiKey) {
        try {
            return await translateWithDeepL(text, sourceLang, targetLang);
        } catch (error) {
            console.warn('DeepL falhou:', error);
        }
    }

    // Fallback final: simulação de tradução
    return await translateTextFallback(text);
}

/**
 * Detecta o idioma do texto (simplificado)
 */
async function detectLanguage(text) {
    // Detecção simples baseada em palavras comuns
    const lowerText = text.toLowerCase();

    // Palavras características de alguns idiomas
    if (/\b(the|and|is|of|to|in|that|have|it|for|on|with|as|this|but|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us)\b/.test(lowerText)) return 'EN';
    if (/\b(el|la|los|las|un|una|es|de|en|y|que|por|con|para|como|más|pero|sus|le|ya|o|este|sí|entre|cuando|todo|esta|ser|son|dos|también|fue|había|era|muy|años|hasta|desde|está|mi|porque|qué|sólo|han|yo|hay|vez|puede|todos|así|son|entre|está|cuando|hay|quien|sus|dos|también|fue|había|era|muy|años|hasta|desde|mi|porque|qué|sólo|han|yo|hay|vez|puede|todos|así|son)\b/.test(lowerText)) return 'ES';
    if (/\b(le|de|des|un|une|et|est|dans|pour|que|avec|par|sur|ce|il|être|ont|pas|plus|peut|tout|son|ont|sont|fait|autre|après|leur|deux|ainsi|lui|donc|ces|entre|encore|même|ont|sont|fait|autre|après|leur|deux|ainsi|lui|donc|ces|entre|encore|même)\b/.test(lowerText)) return 'FR';
    if (/\b(der|die|und|ist|von|zu|ein|eine|mit|für|auf|als|an|werden|dass|kann|diese|sein|hat|nach|wenn|so|aber|auch|nur|noch|bei|ihre|zum|oder|über|wurde|sich|einen|seine|dem|dann|haben|hier|alle|war|sind|wird|ihr|worden|beim|seit|muss|seinen|seiner|ihnen|seinem|wieder|ihrem)\b/.test(lowerText)) return 'DE';
    if (/\b(é|são|está|estão|foi|foram|ser|tem|têm|mais|como|muito|muita|muitos|muitas|já|ainda|assim|quando|onde|qual|quais|cada|todos|todas|após|sobre|dentro|fora|através|apenas|quase|pelo|pela|pelos|pelas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas|neste|nesta|nestes|nestas|neste|naquele|naquela|posso|pode|podemos|podem|deve|devemos|devem|vou|vai|vamos|vão|tenho|tem|temos|têm|estou|está|estamos|estão|faz|fazem|fazemos|diz|dizem|vejo|vê|vemos|vêm|quero|quer|queremos|querem|sei|sabe|sabemos|sabem)\b/.test(lowerText)) return 'PT';

    // Se não conseguir detectar, assume inglês como padrão
    return 'EN';
}

/**
 * Traduz usando MyMemory API
 */
async function translateWithMyMemory(text, source, target) {
    // Constrói a URL da API MyMemory
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
        // Se atingiu o limite de requisições, retorna fallback
        if (data.responseStatus === 429) {
            throw new Error('Limite de traduções atingido');
        }
        throw new Error(data.responseDetails || 'Erro na tradução');
    }

    return data.responseData.translatedText;
}

/**
 * Traduz usando DeepL API (requer chave)
 */
async function translateWithDeepL(text, source, target) {
    const targetCode = target === 'PT' ? 'PT-BR' : target;
    const apiUrl = 'https://api-free.deepl.com/v2/translate';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${CONFIG.deepl.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: [text],
            source_lang: source,
            target_lang: targetCode
        })
    });

    if (!response.ok) {
        throw new Error(`Erro DeepL: ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
}

/**
 * Fallback de tradução se as APIs falharem
 * Mostra uma mensagem amigável com instruções
 */
async function translateTextFallback(text) {
    // Simula delay de tradução
    await new Promise(resolve => setTimeout(resolve, 800));

    // Retorna uma mensagem informativa
    return `[API de tradução temporariamente indisponível ou limite atingido]

Texto original: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"

Para usar tradução real:
1. Obtenha uma chave gratuita em https://rapidapi.com (Google Translate)
2. Ou use a API do DeepL em https://www.deepl.com/pro-api
3. Ou configure sua própria instância do LibreTranslate

Para configurar, edite o arquivo config.js na seção TRANSLATION_CONFIG.`;
}

/**
 * Adiciona uma tradução ao painel
 */
function addTranslation(original, translated) {
    const timestamp = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const item = document.createElement('div');
    item.className = 'translation-item';
    item.innerHTML = `
        <div class="translation-header">
            <span class="translation-lang">Tradução</span>
            <span class="translation-time">${timestamp}</span>
        </div>
        <div class="translation-original">${escapeHtml(original)}</div>
        <div class="translation-result">${escapeHtml(translated)}</div>
    `;

    // Esconder placeholder
    elements.translationPlaceholder.style.display = 'none';
    elements.translationContent.classList.add('active');

    // Adicionar ao container
    elements.translationContent.insertBefore(item, elements.translationContent.firstChild);

    // Salvar no estado
    state.translations.unshift({ original, translated, timestamp });
}

/**
 * Limpa todas as traduções
 */
function clearTranslations() {
    elements.translationContent.innerHTML = '';
    elements.translationContent.classList.remove('active');
    elements.translationPlaceholder.style.display = 'block';
    state.translations = [];
}

/**
 * Manipula eventos de teclado
 */
function handleKeyboard(e) {
    // Navegação com setas
    if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        changePage(-1);
    } else if (e.key === 'ArrowRight' && !e.ctrlKey) {
        changePage(1);
    }

    // Zoom com Ctrl + +/-
    if (e.ctrlKey) {
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            changeZoom(0.2);
        } else if (e.key === '-') {
            e.preventDefault();
            changeZoom(-0.2);
        } else if (e.key === '0') {
            e.preventDefault();
            state.scale = 1.5;
            elements.zoomLevel.textContent = '150%';
            renderPage(state.currentPage);
        }
    }
}

/**
 * Utilitário: debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utilitário: escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Iniciar aplicação
init();

// Exportar para debug
window.pdfTranslator = { state, elements };
