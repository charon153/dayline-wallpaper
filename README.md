# 日序 / Dayline

一款适合通过 Wallpaper Engine「从 URL 打开」使用的静态网页日程壁纸。它显示七天课表、带开始和结束时间的事项、北京时间，以及当前和下一项安排。

在线壁纸地址：<https://charon153.github.io/dayline-wallpaper/>

## 在 Wallpaper Engine 中使用

1. 打开 <https://charon153.github.io/dayline-wallpaper/> 检查页面。
2. 在 Wallpaper Engine 左下角选择「从 URL 打开」，粘贴这个地址。
3. 根据 Wallpaper Engine 的提示设置隐藏桌面图标快捷键。
4. 需要添加事项时，先隐藏桌面图标，再点击壁纸中的「添加事项」。Wallpaper Engine 会显示不含输入框的纯鼠标编辑器，可选择常用名称并调整日期、开始时间和结束时间。

直接下载并导入 `index.html` 也能显示壁纸，并使用相同的纯鼠标编辑器。需要输入任意事项名称或批量调整数据时，请在普通浏览器中打开在线地址，完成键盘编辑后导出 JSON，再粘贴到 Wallpaper Engine 的「日程 JSON」属性。

## 数据与隐私

- 仓库只包含演示课表，不包含真实学号、密码、身份令牌或个人课表。
- 你导入或填写的日程保存在当前设备的浏览器存储中，不会提交到 GitHub。
- 页面不向任何第三方服务发送日程数据。
- GitHub Pages 是公开网页。请不要把个人日程直接写入源代码后提交。
- 更换网址或清除 Wallpaper Engine 网站数据前，请使用设置中的「导出当前 JSON」备份。

学校课表的统一认证导入仍由本机日程应用完成。请将应用导出的 JSON 导入壁纸；不要在本仓库中保存学校账号或密码。

更详细的中文说明见 [`README.txt`](README.txt)。
