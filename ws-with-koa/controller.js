const fs = require('fs');

function addMapping(router, mapping) {
    for(var url in mapping) {
        if(url.startsWith('GET')) {
            var path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`register URL mapping: GET ${path}`);
        } else if(url.startsWith('POST')) {
            var path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`register URL mapping: POST ${path}`);
        } else {
            console.log(`invalid URL: ${url}`);
        }
    }
}

function addControllers(router, controller_dir) {
    var files = fs.readdirSync(`${__dirname}/${controller_dir}`);
    var js_files = files.filter((f) => {
        return f.endsWith('.js');
    });

    for(var f of js_files) {
        console.log(`process controller: ${f}`);
        let mapping = require(`${__dirname}/${controller_dir}/${f}`);
        addMapping(router, mapping);
    }
}

module.exports = function(dir) {
    let
        controller_dir = dir || 'controllers', // 如果不传参数, 扫描目录默认为controllers
        // 注意require('koa-router')返回的是函数
        router = require('koa-router')();
    addControllers(router, controller_dir);
    return router.routes();
};
