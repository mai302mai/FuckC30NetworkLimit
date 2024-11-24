const express = require('express');
const axios = require('axios');
const url = require('url');
const app = express();
const port = 3000;

// 代理请求的处理
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Missing "url" query parameter.');
  }

  try {
    // 获取目标网页内容
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    let htmlContent = response.data;

    // 将相对路径的资源链接替换为完整的目标 URL
    htmlContent = htmlContent.replace(/href="\/([^"]+)"/g, 'href="' + targetUrl + '/$1"');
    htmlContent = htmlContent.replace(/src="\/([^"]+)"/g, 'src="' + targetUrl + '/$1"');
    htmlContent = htmlContent.replace(/url\(['"]?\/([^'")]+)['"]?\)/g, 'url(' + targetUrl + '/$1)');

    // 返回修改后的 HTML 内容
    res.status(response.status).send(htmlContent);
  } catch (error) {
    console.error('Error fetching the target URL:', error);
    res.status(500).send('Failed to fetch the target webpage.');
  }
});

// 代理静态资源
app.get('/proxy/*', async (req, res) => {
  const targetUrl = req.query.url;
  const resourcePath = req.params[0]; // 获取资源路径
  
  if (!targetUrl) {
    return res.status(400).send('Missing "url" query parameter.');
  }

  const fullUrl = url.resolve(targetUrl, resourcePath); // 解析目标 URL
  
  try {
    // 获取目标资源
    const resourceResponse = await axios.get(fullUrl, {
      responseType: 'arraybuffer', // 获取二进制数据，例如图片或文件
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 设置适当的响应类型
    res.setHeader('Content-Type', resourceResponse.headers['content-type']);
    res.status(resourceResponse.status).send(resourceResponse.data);
  } catch (error) {
    console.error('Error fetching the resource:', error);
    res.status(500).send('Failed to fetch the static resource.');
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Proxy server is running at http://localhost:${port}`);
});
