

!function (global) {
  'use strict';

  var previousFancyInput = global.FancyInput;

  function FancyInput(options) {
    this.options = options || {};
  }

  FancyInput.noConflict = function noConflict() {
    global.FancyInput = previousFancyInput;
    return FancyInput;
  };
  
  global.FancyInput = FancyInput;

}(this);




// 用原生canvas元素创建一个fabric实例
const canvas = new fabric.Canvas('schedule');
canvas.selection = false;
canvas.hoverCursor = 'pointer';

// 创建一个矩形对象
const rect = new fabric.Rect({
  left: 100,
  top: 100,
  fill: 'red',
  width: 20,
  height: 20,
  selectable: false
});

const circle = new fabric.Circle({
  radius: 20,
  fill: 'green',
  left: 100,
  top: 100,
  selectable: false
});

// 动画
rect.animate('left', '+=800', {
  onChange: canvas.renderAll.bind(canvas),
  duration: 4000,
});



// 自定义类型
const LabeledCircle = fabric.util.createClass(fabric.Circle, {

  type: 'labeledCircle',

  initialize: function (options) {
    options || (options = {});

    this.callSuper('initialize', options);
    this.set('planName', options.planName || '');
    this.set('planDate', options.planDate || '');
    this.set({
      radius: 5,
      strokeWidth: 3,
      stroke: options.stroke||'#0c0',
      selectable: false
    });
  },

  toObject: function () {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      planName: this.get('planName'),
      planDate: this.get('planDate'),
    });
  },

  _render: function (ctx) {
    this.callSuper('_render', ctx);
    ctx.fillStyle = '#333';
  }
});

const labeledCircle = new LabeledCircle({
  left: 500,
  top: 200,
  planName: '砌体工程',
  planDate: '2018-12-19',
  fill: '#faa',
  stroke: 'red',
});

const labeledCircle2 = new LabeledCircle({
  left: 430,
  top: 200,
  planName: '主体封顶',
  planDate: '2018-12-19',
  fill: '#06f'
});



function makeLine(coords, color) {
  return new fabric.Line(coords, {
    stroke: color||'red',
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
}

function makeText(text, position) {
  return new fabric.Text(text, {
    left: position.left,
    top: position.top,
    fontSize: 10,
    selectable: false
  });
}

const line = makeLine([ 250, 125, 250, 175 ]);
const line2 = makeLine([ 250, 175, 250, 250 ]);
const line3 = makeLine([ 250, 250, 300, 350]);

const lineY = makeLine([ 100, 50, 100, 600 ], '#09f');
const lineX = makeLine([ 0, 550, 1000, 550 ],'#09f');

// X轴刻度
for (let i = 1; i < 15; i++) {
  canvas.add(makeLine([ 100+60*i, 550, 100+60*i, 542 ], '#000'));
  canvas.add(makeText(i + '月',{left: 90+60*i,top:560}));
}

// Y轴刻度
for (let i = 1; i <= 20; i++) {
  canvas.add(makeLine([100, 550 - 25 * i, 105, 550 - 25 * i], '#000'));
  canvas.add(makeText(i + '', {
    left: 80,
    top: 550 - 25 * i
  }));
}

//原点
canvas.add(makeText('0',{
  left: 100,
  top: 550
}))

var point = [100 + 157*(1.42),550-7*(25.23)];
// 根据日期和楼层数自动转换为left与top

// const everyDayLength = getEveryDayLength();
// const everyFloorHeight = getEveryFloorHeight();

function calculatePointCoord(date,level,everyDayLength,everyFloorHeight) {
  // 根据日期和楼层数计算坐标
  var days = getDays(date);

}

const labeledCircle3 = new LabeledCircle({
  left: 300,
  top: 200,
  planName: '砌体工程',
  planDate: '2018-12-19',
  fill: '#ff9',
  stroke: 'red',
});

canvas.add(labeledCircle3)



canvas.add(line, line2, line3,lineY,lineX);


canvas.add(labeledCircle,labeledCircle2);

canvas.add(rect, circle);

const arr = ['砌体工程','主体封顶']

canvas.on('mouse:down', function (options) {
  console.log(options.e.clientX, options.e.clientY, options.target);
  if (options.target) {
    if (options.target.planName && arr.indexOf(options.target.planName) !== -1) {
      console.log('sss',options.target.planName,options.target.planDate);
      
      options.target.animate('left', '+=50', {
        onChange: canvas.renderAll.bind(canvas),
      });

    }
  }

});


