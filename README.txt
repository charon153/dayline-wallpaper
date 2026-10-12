日序 / Dayline · Wallpaper Engine 网页日程壁纸原型

这是一个独立的 Web 壁纸项目。入口是 index.html，所有运行资源都在本目录。
默认仅含演示课程与示例事项；没有任何个人登录凭据或真实课表。

推荐：GitHub Pages URL 壁纸（Wallpaper Engine 内使用纯鼠标编辑）
在线地址：https://charon153.github.io/dayline-wallpaper/
1. 在浏览器打开上述地址，确认日程壁纸可以显示。
2. 在 Wallpaper Engine 左下角选择「从 URL 打开」，粘贴上述 Pages 地址。
3. 按 Wallpaper Engine 的提示设置「隐藏桌面图标」快捷键。
4. 需要编辑时先用该快捷键隐藏桌面图标，再点击「添加事项」或事项卡片。
5. Wallpaper Engine 会显示不含输入框的纯鼠标编辑器，可选择常用名称并用按钮调整
   日期、开始时间、结束时间和重复方式，避免部分 CEF 版本的键盘焦点崩溃。

日程数据只写入当前电脑中该网址对应的 localStorage，不会随仓库或 GitHub Pages
上传。清理浏览器/Wallpaper Engine 网站数据或更换 Pages 地址可能丢失本地日程，
因此修改后请使用「导出当前 JSON」保留备份。

在 Wallpaper Engine 中使用
1. 打开 Wallpaper Engine 壁纸编辑器。
2. 将本目录的 index.html 拖到「创建壁纸」按钮，导入这个独立目录。
   不要导入整个 schedule-app 工作目录，以免把自己的数据、备份或日志一起带进去。
3. 若编辑器重新生成了 project.json，请用本目录 project.json 的 general.properties
   配置属性，或在「编辑 → 更改项目设置」中添加以下属性：
   theme（combo: light/dark）、panelopacity（slider:30–100）、
   showclock/showroom（bool）、schedulejson（textinput，默认空）。
4. 应用壁纸，先使用默认演示数据检查时间、字号、交互及屏幕布局。

导入自己的日程
1. 原日程表应用 → 导入课表 → 数据管理 → 导出全部数据。
2. 在普通浏览器中打开本目录 index.html，点右上角设置，粘贴导出的 JSON 并导入。
3. 可在浏览器中添加、修改或删除事项，检查学期起点和课程时间。
4. 点「导出当前 JSON」，复制文本框中的单行 JSON。
5. 回到 Wallpaper Engine，在右侧「日程 JSON」属性粘贴该内容。
   本项目会读取你的数据并在本机保存；浏览器与 Wallpaper Engine 各自保存一份。
   Wallpaper Engine CEF 宿主不稳定支持网页键盘焦点；无论本地文件还是 URL 模式，
   都会使用纯鼠标编辑器。任意事项名称和批量修改仍可在普通浏览器完成，再导出 JSON。

课程按导入的实际节次时间和周次显示。旧无结束时间的事项仍作为时间点；
新事项可填写同一天的开始和结束时间。支持每天、每周、工作日、自定义星期，
以及旧数据的排除日期规则。北京时间用于时钟、日期与当前安排计算。
时钟与日程状态以分钟精度显示；此原型不负责系统级定时提醒。

此独立版不自动连接学校统一认证，不自动同步原应用，也不回写原应用。
Windows 通知和声音由原日程表应用提供；Wallpaper Engine 暂停或关闭时不保证计时执行。
刷新后本地导入的数据继续使用；相同的日程属性不会反复覆盖你在壁纸内的编辑。
清空「日程 JSON」属性不会清空当前本机数据；「恢复演示数据」可替换显示数据。
原数据会留一份在浏览器 localStorage 的 dayline.previous.v1；建议主动导出 JSON 备份。

发布到 GitHub
本目录可以作为单独的公开仓库，随附的 .github/workflows/pages.yml 只会把明确
列出的七个运行资源部署到 GitHub Pages。不要上传外层 schedule-app 目录、data、
probe、日志、备份或浏览器资料。不要把个人数据写入 project.json、model.js 或公开
预设；个人导入保存在宿主 localStorage 中，不写回源文件。背景和图形由本项目
CSS/SVG 创建，没有引用学校标志或第三方图片。本方案不需要上传 Steam 创意工坊。

验证范围
已验证普通 Chromium 浏览器中的事项录入、错误时间拒绝、编辑、JSON导入与导出、
刷新持久化；模型和宿主属性接口有独立自动化回归。也已在 Wallpaper Engine 的
webwallpaper64 独立播放窗口中运行交互回归，覆盖周导航、设置、导出、显示属性、
新建事项、课程详情和已有事项编辑，测试期间窗口保持响应且未新增崩溃日志。
为兼容 Wallpaper Engine 内置 Chromium，弹层采用普通 HTML/CSS 覆盖层，不调用
原生 dialog 顶层接口、原生日期/时间选择器或背景模糊合成。直接导入文件的 Wallpaper
Engine 宿主中的添加和编辑入口使用只含按钮的纯鼠标编辑器，避免 CEF 键盘焦点处理器
崩溃；普通 Chromium 浏览器继续保留完整键盘表单。纯鼠标编辑器已通过离线宿主回归，
发布后的 GitHub Pages 地址仍需在 Wallpaper Engine 中做一次实际点击验收。暂停恢复、
配置跨重启持久化和实际内存/GPU占用仍需单独验收。

官方说明
https://docs.wallpaperengine.io/en/web/first/gettingstarted.html
https://docs.wallpaperengine.io/en/web/customization/properties.html
https://docs.wallpaperengine.io/en/web/api/propertylistener.html
