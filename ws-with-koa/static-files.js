const path = require('path');
const mime = require('mime');
const fs = require('mz/fs'); // mz封装了fs对应的函数改为Promise, 这样就可以非常简单的用await调用mz的函数

// url: /static/
// dir: __dirname + '/static'
function staticFiles(url, dir) {
    return async(ctx, next) => {
        let rpath = ctx.request.path;
        // 判断是否以指定url开头
        if(rpath.startsWith(url)) {
            // 获取文件完整路径
            let fp = path.join(dir, rpath.substring(url.length));
            // 判断文件是否存在
            if(await fs.exists(fp)) {
                // 查找文件的mime
                ctx.response.type = mime.getType(rpath);
                // 读取文件内容并赋值给response.body
                ctx.response.body = await fs.readFile(fp);
            } else {
                // 文件不存在
                ctx.response.status = 404;
            }
        } else {
            // 不是指定前缀的URL, 继续处理下一个middleware
            await next();
        }
    };
}

module.exports = staticFiles;
