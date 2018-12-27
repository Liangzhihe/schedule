function Schedule(id, data) {
    this.id = id;
    this.data = data;
}

Schedule.prototype = {
    constructor: Schedule,

    init: function () {
        console.log("class", this.id, this.data);
        const canvas = new fabric.Canvas(this.id);
        this.clean(canvas);
        this.basicSetUp(canvas);
        this.setAxis(canvas, this.data);
    },

    clean: function (canvas) {
        canvas.remove();
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
        const projectName = data.randerData.projectName;
        const buildLayers = data.randerData.buildLayers; //楼层数
        const buildSequence = data.randerData.buildSequence; //楼栋号
        const axisStartDate = this.toolFunc.getFirstDate(data.randerData.startDate); //坐标轴初始日期
        const axisEndDate = this.toolFunc.getAddDate(data.randerData.endDate, 100); //坐标轴结束日期 （相对于计划结束日期又增加了100天）
        const totalDays = this.toolFunc.calculateRangeDays(axisStartDate, axisEndDate); //坐标轴总天数
        
        console.log(totalDays);
        this.setAxisX({
            canvas,
            cWidth,
            cHeight,
            marginBottom,
            marginLeft,
            axisStartDate,
            totalDays
        }); //x轴是时间轴，需要总天数(预计楼栋建设持续时间加上左右预留时间)
        this.setAxisY({
            canvas,
            cWidth,
            cHeight,
            marginTop,
            marginLeft,
            marginBottom,
            buildLayers
        }); //y轴是楼层轴
        this.setFloorState({
            canvas,
            cHeight,
            marginTop,
            marginBottom,
            projectName,
            buildLayers,
            buildSequence
        }); //楼层状态显示(当传入真实进度数据时，通过遍历比较真实进度数据与真实计划数据，根据比较结果改变其状态)
    },

    setAxisX: function(obj) {
        console.log("canvas",obj.canvas);
        const canvas = obj.canvas;
        const lineX = this.toolFunc.makeLine([0, obj.cHeight-obj.marginBottom, obj.cWidth, obj.cHeight-obj.marginBottom], '#09f');//x轴线
        this.setScaleX(obj);
        canvas.add(lineX);
    },
    setAxisY: function(obj) {
        const canvas = obj.canvas;
        const lineY = this.toolFunc.makeLine([obj.marginLeft, obj.marginTop, obj.marginLeft, obj.cHeight], '#09f');
        this.setScaleY(obj);
        canvas.add(lineY);
    },

    // 设置x轴刻度
    setScaleX: function(obj) {
        // console.log(this);
        // console.log("111",obj,canvas);
        const canvas = obj.canvas;
        let arr = [];
        const scaleArr = this.calculateScale(arr, obj.totalDays, obj.axisStartDate);
        // console.log("222",arr);//递归得出刻度数值
        console.log("scaleArr",scaleArr);//递归得出刻度数值
        const len = scaleArr.length;
        const w = obj.cWidth - obj.marginLeft;
        for (let i = 0; i < len; i++) {
            const element = scaleArr[i];
            let l = 0;
            for (let j = 0; j <= i; j++) {
                l += scaleArr[j].day;
            }
            const newDate = new Date(element.date.replace('/-/g', '/'));
            const month =  newDate.getMonth() + 1;
            if (month === 12) {
                canvas.add(this.toolFunc.makeText(newDate.getFullYear().toString(), {left:obj.marginLeft + (w/obj.totalDays)*(l-5),top: obj.cHeight - obj.marginBottom + 18}));
            }
            canvas.add(this.toolFunc.makeLine([obj.marginLeft + (w/obj.totalDays)*l, obj.cHeight - obj.marginBottom, obj.marginLeft + (w/obj.totalDays)*l, obj.cHeight - obj.marginBottom - 8], '#09f'));
            canvas.add(this.toolFunc.makeText(month.toString() + '月', {left:obj.marginLeft + (w/obj.totalDays)*(l-element.day/1.5),top: obj.cHeight - obj.marginBottom + 5}));
        }
    },

    calculateScale: function(arr, totalDays, startDate) {
        let monthDay = this.toolFunc.getMonthDate(startDate);
        if (totalDays > monthDay) {
        // if (totalDays > 0) { // 注意边界条件
            let obj = {date: startDate, day: monthDay};
            totalDays -= monthDay;
            startDate = this.toolFunc.getAddDate(startDate,monthDay);
            arr.push(obj);
            this.calculateScale(arr, totalDays, startDate);
            return arr;
        }
    },

    // 设置y轴刻度
    setScaleY: function(obj) {
        const canvas = obj.canvas;
        const h = obj.cHeight - obj.marginBottom - obj.marginTop;
        const buildLayers = obj.buildLayers;
        for (let i = 1; i <= buildLayers; i++) {
           canvas.add(this.toolFunc.makeLine([obj.marginLeft,(obj.cHeight-obj.marginBottom)-(i/buildLayers)*h,obj.marginLeft+5,(obj.cHeight-obj.marginBottom)-(i/buildLayers)*h], '#09f'));
           canvas.add(this.toolFunc.makeText(i.toString(), {left:obj.marginLeft-15,top: (obj.cHeight-obj.marginBottom)-(i/buildLayers)*h+2 }));
        }

    },

    // 设置每楼层状态显示（工期提前或延误）
    setFloorState: function(obj) {
        //自定义楼层状态类型
        const that = this;
        const canvas = obj.canvas;
        const h = obj.cHeight - obj.marginBottom - obj.marginTop;
        const projectName = obj.projectName;
        const buildLayers = obj.buildLayers;
        const buildSequence = obj.buildSequence;
        const LabeledRect = this.toolFunc.customFloor();
        for (let i = 1; i <= buildLayers; i++) {
            const temp = new LabeledRect({
                width: 30,
                height: h/buildLayers,
                left:0,
                top: (obj.cHeight-obj.marginBottom)-(i/buildLayers)*h,
                buildName: buildSequence,
                floor: i,
                type: 'floorState'
            })
            canvas.add(temp);
        }
        canvas.on('mouse:down', function (options) {
            console.log(options.e.clientX, options.e.clientY, options.target);
            if (options.target) {
                if (options.target.type === 'floorState') {
                    console.log('floorState', options.target);
                    that.showFloorState({projectName});
                    // canvas.clear();
                    // options.target.animate('left', '+=50', {
                    //     onChange: canvas.renderAll.bind(canvas),
                    // });
                }
            }
        });
    },

    showFloorState: function (obj) {
        // 显示当前选中楼层延期或提前的进度状态
        console.log(obj.projectName);
    },

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
        getAddDate: function(date, days) {
            const newDate = new Date(date.replace('/-/g', '/'));
            newDate.setDate(newDate.getDate() + days);
            const month = newDate.getMonth() + 1;
            const day = newDate.getDate();
            const time = newDate.getFullYear() + "-" + month + "-" + day;
            // console.log(time);
            return time;
        },

        // 获取该月份天数
        getMonthDate: function(date) {
            const newDate = new Date(date.replace('/-/g', '/'));
            const month =  newDate.getMonth() + 1;
            const d = new Date(newDate.getFullYear(), month, 0);
            return d.getDate();
        },

        // 获取日期所在月第一日
        getFirstDate: function(startDate) {
            const newDate = new Date(startDate.replace('/-/g', '/'));
            const month =  newDate.getMonth() + 1;
            const firstDate = newDate.getFullYear() + '-' + month + '-' + '01';
            return firstDate;
        },

        // 自定义楼层状态类型
        customFloor: function() {
            const LabeledRect = fabric.util.createClass(fabric.Rect, {
                type: 'labeledRect',
                initialize: function (options = {}) {
                    this.callSuper('initialize', options);
                    this.set('buildName', options.buildName || '');
                    this.set('floor', options.floor || '');
                    this.set('type', options.type || '');
                    this.set({
                        fill: '#ccc',
                        borderColor: '#09f',
                        strokeWidth: .1,
                        stroke: '#fff',
                        selectable: false
                    });
                },
                toObject: function () {
                    return fabric.util.object.extend(this.callSuper('toObject'), {
                        buildName: this.get('buildName'),
                        floor: this.get('floor'),
                        type: this.get('type'),
                    });
                },
                _render: function (ctx) {
                    this.callSuper('_render', ctx);
                    // ctx.fillStyle = '#333';
                }
            });
            return LabeledRect;
        }

    }
}




// // 用原生canvas元素创建一个fabric实例
// const canvas = new fabric.Canvas('schedule');
// canvas.selection = false;
// canvas.hoverCursor = 'pointer';

// // 创建一个矩形对象
// const rect = new fabric.Rect({
//     left: 100,
//     top: 100,
//     fill: 'red',
//     width: 20,
//     height: 20,
//     selectable: false
// });

// //圆形对象
// const circle = new fabric.Circle({
//     radius: 20,
//     fill: 'green',
//     left: 100,
//     top: 100,
//     selectable: false
// });

// // 动画
// rect.animate('left', '+=800', {
//     onChange: canvas.renderAll.bind(canvas),
//     duration: 4000,
// });



// // 自定义类型
// const LabeledCircle = fabric.util.createClass(fabric.Circle, {

//     type: 'labeledCircle',

//     initialize: function (options = {}) {

//         this.callSuper('initialize', options);
//         this.set('planName', options.planName || '');
//         this.set('planDate', options.planDate || '');
//         this.set({
//             radius: 5,
//             strokeWidth: 3,
//             stroke: options.stroke || '#0c0',
//             selectable: false
//         });
//     },

//     toObject: function () {
//         return fabric.util.object.extend(this.callSuper('toObject'), {
//             planName: this.get('planName'),
//             planDate: this.get('planDate'),
//         });
//     },

//     _render: function (ctx) {
//         this.callSuper('_render', ctx);
//         ctx.fillStyle = '#333';
//     }
// });

// const labeledCircle = new LabeledCircle({
//     left: 500,
//     top: 200,
//     planName: '砌体工程',
//     planDate: '2018-12-19',
//     fill: '#faa',
//     stroke: 'red',
// });

// const labeledCircle2 = new LabeledCircle({
//     left: 430,
//     top: 200,
//     planName: '主体封顶',
//     planDate: '2018-12-19',
//     fill: '#06f'
// });



// function makeLine(coords, color = 'red') {
//     return new fabric.Line(coords, {
//         stroke: color,
//         strokeWidth: 1,
//         selectable: false,
//         evented: false,
//     });
// }

// function makeText(text, position) {
//     return new fabric.Text(text, {
//         left: position.left,
//         top: position.top,
//         fontSize: 10,
//         selectable: false
//     });
// }

// const lineY = makeLine([50, 100, 50, 600], '#09f');
// const lineX = makeLine([0, 500, 1000, 500], '#09f');

// // X轴刻度
// // for (let i = 1; i <= 15; i++) {
// //     canvas.add(makeLine([50 + 60 * i, 500, 50 + 60 * i, 492], '#000'));
// //     canvas.add(makeText(i + '月', {
// //         left: 40 + 60 * i,
// //         top: 510
// //     }));
// // }

// // Y轴刻度
// for (let i = 1; i <= 16; i++) {
//     canvas.add(makeLine([50, 500 - 25 * i, 55, 500 - 25 * i], '#000'));
//     canvas.add(makeText(i + '', {
//         left: 35,
//         top: 508 - 25 * i
//     }));
// }

// //原点
// canvas.add(makeText('0', {
//     left: 50,
//     top: 500
// }))

// var point = [100 + 157 * (1.42), 550 - 7 * (25.23)];
// // 根据日期和楼层数自动转换为left与top

// // const everyDayLength = getEveryDayLength();
// // const everyFloorHeight = getEveryFloorHeight();

// function calculatePointCoord(date, level, everyDayLength, everyFloorHeight) {
//     // 根据日期和楼层数计算坐标
//     var days = getDays(date);

// }

// const labeledCircle3 = new LabeledCircle({
//     left: 300,
//     top: 200,
//     planName: '砌体工程',
//     planDate: '2018-12-19',
//     fill: '#ff9',
//     stroke: 'red',
// });

// canvas.add(labeledCircle3)



// canvas.add(lineY, lineX);


// canvas.add(labeledCircle, labeledCircle2);

// canvas.add(rect, circle);

// const arr = ['砌体工程', '主体封顶']

// canvas.on('mouse:down', function (options) {
//     console.log(options.e.clientX, options.e.clientY, options.target);
//     if (options.target) {
//         if (options.target.planName && arr.indexOf(options.target.planName) !== -1) {
//             console.log('sss', options.target.planName, options.target.planDate);

//             options.target.animate('left', '+=50', {
//                 onChange: canvas.renderAll.bind(canvas),
//             });

//         }
//     }

// });
