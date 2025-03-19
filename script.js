function calculateMetrics() {
    // 获取用户输入的数值
    const incomeMonthly = parseFloat(document.getElementById('income').value);
    const housePrice = parseFloat(document.getElementById('price').value);
    const downPaymentPercentage = parseFloat(document.getElementById('down_payment').value) / 100;
    const loanRateAnnual = parseFloat(document.getElementById('rate').value) / 100;
    const loanYears = parseInt(document.getElementById('years').value, 10);
    const currentSavings = parseFloat(document.getElementById('savings').value);

    // 检查输入是否为有效数字
    if (isNaN(incomeMonthly) || isNaN(housePrice) || isNaN(downPaymentPercentage) || isNaN(loanRateAnnual) || isNaN(loanYears) || isNaN(currentSavings)) {
        alert("请输入有效的数值！");
        return;
    }

    // 显示加载动画
    showLoading();

    // 计算年收入
    const incomeYearly = incomeMonthly * 12;

    // 计算首付金额
    const downPayment = housePrice * downPaymentPercentage;

    // 计算贷款总额
    const loanAmount = housePrice - downPayment;

    // 计算月利率
    const monthlyRate = loanRateAnnual / 12;

    // 计算贷款总月数
    const months = loanYears * 12;

    // 计算每月月供
    const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalInterest = monthlyPayment * months - loanAmount;

    // 计算购房后的剩余储蓄
    const remainingSavings = currentSavings - downPayment;

    // 计算储蓄覆盖率（剩余储蓄 / (月供 * 6)）
    const savingsCoverageRatio = remainingSavings / (monthlyPayment * 6);

    // 计算房价收入比
    const priceToIncomeRatio = housePrice / incomeYearly;

    // 计算月供收入比
    const monthlyPaymentRatio = monthlyPayment / incomeMonthly;

    // 显示计算结果
    const result = `
        房价收入比：<span class="${priceToIncomeRatio > 10 ? 'red' : 'green'}">${priceToIncomeRatio.toFixed(2)} 倍</span><br>
        月供收入比：<span class="${monthlyPaymentRatio > 0.4 ? 'red' : 'green'}">${(monthlyPaymentRatio * 100).toFixed(2)} %</span><br>
        首付款：${(downPayment / 10000).toFixed(2)} 万元<br>
        贷款总额：${(loanAmount / 10000).toFixed(2)} 万元<br>
        每月月供：${monthlyPayment.toFixed(2)} 元<br>
        总利息：${(totalInterest / 10000).toFixed(2)} 万元<br>
        购房后剩余储蓄：${(remainingSavings / 10000).toFixed(2)} 万元<br>
        储蓄覆盖率：<span class="${savingsCoverageRatio < 1 ? 'red' : 'green'}">${savingsCoverageRatio.toFixed(2)}</span>
    `;
    document.getElementById('result').innerHTML = result;

    // 提供购房建议
    // let advice = "";
    // if (priceToIncomeRatio > 10) {
    //     advice += "<span class='red'>房价收入比过高，建议考虑其他更为适合的购房区域。</span><br>";
    // } else {
    //     advice += "<span class='green'>房价收入比在合理范围内。</span><br>";
    // }

    // if (monthlyPaymentRatio > 0.4) {
    //     advice += "<span class='red'>月供占收入比偏高，需慎重考虑每月还款压力。</span><br>";
    // } else {
    //     advice += "<span class='green'>月供占收入比合理。</span><br>";
    // }

    // if (savingsCoverageRatio < 1) {
    //     advice += "<span class='red'>购房后剩余储蓄不足以覆盖至少6个月的月供，应提高储蓄储备。</span><br>";
    // } else {
    //     advice += "<span class='green'>购房后储蓄充足，财务状况良好。</span><br>";
    // }

    // document.getElementById('advice').innerHTML = advice;

    // Send POST request to API
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${__API_KEY__}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "Qwen/Qwen2.5-7B-Instruct",
            stream: false,
            max_tokens: 512,
            temperature: 0.7,
            top_p: 0.7,
            top_k: 50,
            frequency_penalty: 0.5,
            n: 1,
            messages: [
                {
                    role: "system",
                    content: "你是个专业的房产分析师，请根据我提供的数据结合中国楼市进行总结，并给出购房建议。说人话，我是不是该买这套房？请在 300 字以内总结以下内容。"
                },
                {
                    role: "user",
                    content: result
                }
            ]
        })
    };

    fetch('https://api.siliconflow.cn/v1/chat/completions', options)
        .then(response => response.json())
        .then(data => {
            if (data.choices && data.choices.length > 0) {
                const markdownText = data.choices[0].message.content;
                renderMarkdownWithTypewriter(markdownText);
            } else {
                document.getElementById('advice').innerHTML = "无法获取建议，请稍后再试。";
            }
        })
        .catch(err => {
            console.error(err);
            document.getElementById('advice').innerHTML = "请求失败，请检查网络连接。";
        })
}

// Markdown 渲染 + 打字机效果
function renderMarkdownWithTypewriter(markdownText) {
    const contentDiv = document.getElementById('advice');
    contentDiv.innerHTML = ""; // 清空旧内容

    // Clear the placeholder text
    document.getElementById('advice').textContent = "";

    // 1. 使用 Showdown 解析 Markdown 为 HTML
    const converter = new showdown.Converter();
    const htmlText = converter.makeHtml(markdownText);

    // 2. 先解析 HTML，再逐字显示（防止 <p> 变成字符串）
    let index = 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;  // 这里解析 HTML，不让浏览器误认为是字符串

    const finalText = tempDiv.innerHTML;  // 获取解析后的 HTML 代码
    function type() {
        if (index < finalText.length) {
            contentDiv.innerHTML = finalText.substring(0, index + 1);
            index++;
            setTimeout(type, 10); // 控制打字速度
        }
    }
    type();
}

function showLoading() {
    const adviceDiv = document.getElementById('advice');
    let loadingDiv = document.getElementById('loading');

    // 如果 loadingDiv 不存在，则创建并添加它
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.style.display = 'block'; // 初始为显示状态
        loadingDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 分析中...';
        adviceDiv.appendChild(loadingDiv);
    } else {
        // 如果存在，确保它是可见的
        loadingDiv.style.display = 'block';
    }

    // 清空建议内容
    adviceDiv.innerHTML = "";  
    adviceDiv.appendChild(loadingDiv);  // 确保每次都显示 loadingDiv
}

function hideLoading(adviceText) {
    const adviceDiv = document.getElementById('advice');
    const loadingDiv = document.getElementById('loading');

    // 隐藏加载动画
    if (loadingDiv) {
        loadingDiv.style.display = "none";
    }

    // 显示新的建议内容
    adviceDiv.innerHTML = adviceText;
}