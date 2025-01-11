function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('show');
}

function toggleAnswer(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.icon');
    
    if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
        icon.innerHTML = '▼';
    } else {
        answer.style.maxHeight = answer.scrollHeight + "px";
        icon.innerHTML = '▲';
    }
}

// 语言重定向逻辑
function redirectToLanguage() {
    // 获取浏览器语言
    const browserLang = navigator.language || navigator.userLanguage;
    const lang = browserLang.split('-')[0];
    
    // 如果已经在语言特定页面上，不进行重定向
    if (window.location.pathname.match(/\/(ar|fr|ko|ja|de|zh)$/)) {
        return;
    }
    
    // 支持的语言映射
    const supportedLangs = {
        'ja': '/ja'
    };
    
    // 如果浏览器语言在支持列表中且不是英语，进行重定向
    if (supportedLangs[lang] && lang !== 'en') {
        window.location.href = supportedLangs[lang];
    }
}

// 页面加载时执行重定向
//window.addEventListener('load', redirectToLanguage);

// 添加以下函数来设置语言选择器的默认值
function setLanguageSelector() {
    const path = window.location.pathname;
    const languageSelect = document.querySelector('.language-selector select');
    
    if (!languageSelect) return;

    // 根据路径设置选择器的值
    switch (path) {
        case '/ja':
            languageSelect.value = '/ja';
            break;
        default:
            languageSelect.value = '/';
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    setLanguageSelector();
});