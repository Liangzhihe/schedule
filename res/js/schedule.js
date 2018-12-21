function Schedule(id, data) {
    this.id = id;
    this.data = data;
}

Schedule.prototype = {
    constructor: Schedule,

    init: function () {
        console.log("class", this.id, this.data);
        const canvas = new fabric.Canvas(this.id);
        this.basicSetUp(canvas);
        this.setAxis(canvas, this.data);
    },

    basicSetUp: function (canvas) {
        canvas.selection = false;
        canvas.hoverCursor = 'pointer';
    },

    setAxis: function(canvas, data) {
        const cWidth = canvas.width;
        const cHeight = canvas.height;
        const marginTop = 100; //顶部留白
        const marginBottom = 100; //底部留白
        const marginLeft = 50; //左侧留白
        const buildLayers = data.randerData.buildLayers; //楼层数
        const totalDays = this.toolFunc.calculateRangeDays(data.randerData.startDate, data.randerData.endDate); //预计楼栋建设持续天数
        console.log(totalDays);
        this.setAxisX(cWidth, cHeight, marginBottom, marginLeft, totalDays); //x轴是时间轴，需要总天数(预计楼栋建设持续时间加上左右预留时间)
        this.setAxisY(cWidth, cHeight, marginTop, marginBottom, buildLayers); //y轴是楼层轴
    },

    setAxisX: function(cWidth,cHeight,marginBottom, marginLeft) {
        console.log("canvas",canvas)
        const lineX = this.toolFunc.makeLine([0, cHeight-marginBottom, cWidth, cHeight-marginBottom], '#09f');//x轴线
        // X轴刻度
        // for (let i = 1; i <= 15; i++) {
        //     canvas.add(this.toolFunc.makeLine([marginLeft + 60 * i, cHeight-marginBottom, marginLeft + 60 * i, cHeight-marginBottom - 8], '#000'));
        //     canvas.add(this.toolFunc.makeText(i + '月', {
        //         left: 40 + 60 * i,
        //         top: 510
        //     }));
        // }
        canvas.add(lineX);
    },
    setAxisY: function() {},

    toolFunc: {
        makeLine: function (coords, color = 'red') {
            return new fabric.Line(coords, {
                stroke: color,
                strokeWidth: 1,
                selectable: false,
                evented: false,
            });
        },
        makeText: function (text, position) {
            return new fabric.Text(text, {
                left: position.left,
                top: position.top,
                fontSize: 10,
                selectable: false
            });
        },
        //计算并返回两个日期之间的相差的天数
        calculateRangeDays: function (dateString1, dateString2) {
            //获取起始时间的毫秒数
            //其中dateString1.replace('/-/g','/')是将日期格式为yyyy-mm-dd转换成yyyy/mm/dd
            //Date.parse()静态方法的返回值为1970年1月1日午时到当前字符串时间的毫秒数，返回值为整数
            //如果传入的日期只包含年月日不包含时分秒，则默认取的毫秒数为yyyy/mm/dd 00:00:00
            //取的是0时0分0秒的毫秒数，如果传入的是2015/07/03 12:20:12则取值为该时间点的毫秒数
            console.log(dateString1, dateString2);
            const startDate = Date.parse(dateString1.replace('/-/g', '/'));
            const endDate = Date.parse(dateString2.replace('/-/g', '/'));
            // console.log(startDate, endDate);
            //因为不传时分秒的时候 默认取值到dateString2的0时0分0秒时的毫秒数，这样就不包含当前天数的毫秒数
            const diffDate = (endDate - startDate);
            //计算出两个日期字符串之间的相差的天数
            //如果计算时要包含日期的当前天，就要加上一天
            const days = parseInt(diffDate / (1 * 24 * 60 * 60 * 1000));
            return days;
        },

        // 传入日期及天数，返回相加后的新日期
        addDate: function(date, days) {
            var newDate = new Date(date.replace('/-/g', '/'));
            newDate.setDate(newDate.getDate() + days);
            var month = newDate.getMonth() + 1;
            var day = newDate.getDate();
            var time = newDate.getFullYear() + "-" + month + "-" + day;
            console.log(time);
            return time;
        },

        // 获取该月份天数
        mGetDate: function(year, month) {
            var d = new Date(year, month, 0);
            return d.getDate();
        }
    }
}




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

//圆形对象
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

    initialize: function (options = {}) {

        this.callSuper('initialize', options);
        this.set('planName', options.planName || '');
        this.set('planDate', options.planDate || '');
        this.set({
            radius: 5,
            strokeWidth: 3,
            stroke: options.stroke || '#0c0',
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



function makeLine(coords, color = 'red') {
    return new fabric.Line(coords, {
        stroke: color,
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

const lineY = makeLine([50, 100, 50, 600], '#09f');
const lineX = makeLine([0, 500, 1000, 500], '#09f');

// X轴刻度
for (let i = 1; i <= 15; i++) {
    canvas.add(makeLine([50 + 60 * i, 500, 50 + 60 * i, 492], '#000'));
    canvas.add(makeText(i + '月', {
        left: 40 + 60 * i,
        top: 510
    }));
}

// Y轴刻度
for (let i = 1; i <= 16; i++) {
    canvas.add(makeLine([50, 500 - 25 * i, 55, 500 - 25 * i], '#000'));
    canvas.add(makeText(i + '', {
        left: 35,
        top: 508 - 25 * i
    }));
}

//原点
canvas.add(makeText('0', {
    left: 50,
    top: 500
}))

var point = [100 + 157 * (1.42), 550 - 7 * (25.23)];
// 根据日期和楼层数自动转换为left与top

// const everyDayLength = getEveryDayLength();
// const everyFloorHeight = getEveryFloorHeight();

function calculatePointCoord(date, level, everyDayLength, everyFloorHeight) {
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



canvas.add(lineY, lineX);


canvas.add(labeledCircle, labeledCircle2);

canvas.add(rect, circle);

const arr = ['砌体工程', '主体封顶']

canvas.on('mouse:down', function (options) {
    console.log(options.e.clientX, options.e.clientY, options.target);
    if (options.target) {
        if (options.target.planName && arr.indexOf(options.target.planName) !== -1) {
            console.log('sss', options.target.planName, options.target.planDate);

            options.target.animate('left', '+=50', {
                onChange: canvas.renderAll.bind(canvas),
            });

        }
    }

});
