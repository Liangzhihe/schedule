// 用原生canvas元素创建一个fabric实例
var canvas = new fabric.Canvas('schedule');

// 创建一个矩形对象
var rect = new fabric.Rect({
  left: 100,
  top: 100,
  fill: 'red',
  width: 20,
  height: 20
});

// 将矩形添加到canvas画布上
canvas.add(rect);