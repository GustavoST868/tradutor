/**
 * CONFIGURAÇÃO DE APIs DE TRADUÇÃO
 *
 * Este arquivo permite configurar qual API de tradução usar.
 * Escolha uma das opções abaixo e preencha os dados necessários.
 */

const TRANSLATION_CONFIG = {
    /**
     * OPÇÃO 1: MyMemory (Recomendado - Grátis)
     * - 1000 palavras/dia gratuitas
     * - Não precisa de cadastro para uso básico
     * - Site: https://mymemory.translated.net/
     */
    myMemory: {
        enabled: true,  // Defina como false para desabilitar
    },

    /**
     * OPÇÃO 2: DeepL (Mais precisa - Requer chave)
     * - Cadastro gratuito: https://www.deepl.com/pro-api
     * - 500.000 caracteres/mês gratuitos
     * - Mais precisa que MyMemory
     */
    deepl: {
        enabled: false,  // Defina como true para usar
        apiKey: '',      // Cole sua chave API aqui entre aspas
    },

    /**
     * OPÇÃO 3: Google Cloud Translation (Requer conta GCP)
     * - Precisa de conta no Google Cloud
     * - 500.000 caracteres/mês gratuitos
     * - Documentação: https://cloud.google.com/translate
     */
    google: {
        enabled: false,  // Defina como true para usar
        apiKey: '',      // Cole sua chave API aqui entre aspas
    },

    /**
     * OPÇÃO 4: LibreTranslate Self-Hosted
     * - Rode seu próprio servidor de tradução
     * - Gratuito e sem limites
     * - Docker: docker run -ti -p 5000:5000 libretranslate/libretranslate
     * - URL local: http://localhost:5000/translate
     */
    libreTranslate: {
        enabled: false,
        url: 'http://localhost:5000/translate',  // Altere conforme sua configuração
        apiKey: '',  // Opcional, se configurado no servidor
    },
};

// Exporta para uso no app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TRANSLATION_CONFIG };
}
