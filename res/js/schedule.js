function Schedule(id, data) {
    this.id = id;
    this.data = data;
    this.marginTop = 100;
    this.marginBottom = 100;
    this.marginLeft = 50;
}

let staticCanvas = {};

Schedule.prototype = {
    constructor: Schedule,
    init: function () {
        // 每次初始化之前清除当前的canvas对象上的图像clear，仍使用该对象
        console.log("class", this.id, this.data);
        // const canvas = new fabric.Canvas(this.id);
        const canvas = this.getFabricCanvas(this.id);
        if (JSON.stringify(staticCanvas) === "{}") {
            //首次加载时注册事件
            this.addEvent(canvas);
        };
        staticCanvas = canvas; // 保存生成的fabric对象至全局变量staticCanvas
        const randerData = this.data.randerData;

        const axisStartDate = this.toolFunc.getFirstDate(randerData.startDate); //坐标轴初始日期
        const axisEndDate = this.toolFunc.getAddDate(randerData.endDate, 100); //坐标轴结束日期 （相对于计划结束日期又增加了100天）
        const totalDays = this.toolFunc.calculateRangeDays(axisStartDate, axisEndDate); //坐标轴总天数

        this.clean(canvas);
        this.basicSetUp(canvas);
        // this.setAxis(canvas, this.data); // 此处可以优化，不需要将所有数据传入
        this.setAxis({
            canvas,
            projectName: randerData.projectName,
            buildLayers: randerData.buildLayers,
            buildSequence: randerData.buildSequence,
            startDate: randerData.startDate,
            endDate: randerData.endDate,
            axisStartDate,
            totalDays
        });
        this.showPlan({
            canvas,
            axisStartDate,
            totalDays,
            randerData
        });
    },

    // 获取fabric对象
    getFabricCanvas: function (id) {
        // console.log("staticCanvas",staticCanvas);
        if (JSON.stringify(staticCanvas) === "{}") {
            console.log('首次加载');
            return new fabric.Canvas(id);
        } else {
            return staticCanvas;
        }
    },

    // 清空画布
    clean: function (canvas) {
        canvas.clear();
        // canvas.removeListeners();
    },

    basicSetUp: function (canvas) {
        canvas.selection = false;
        canvas.hoverCursor = 'pointer';
    },

    setAxis: function (obj) {
        const {
            canvas,
            projectName,
            buildLayers,
            buildSequence,
            axisStartDate,
            totalDays
        } = obj;
        const cWidth = canvas.width;
        const cHeight = canvas.height;
        const marginTop = this.marginTop; //顶部留白
        const marginBottom = this.marginBottom; //底部留白
        const marginLeft = this.marginLeft; //左侧留白
        // buildLayers; //楼层数
        // buildSequence; //楼栋号

        // console.log(totalDays);
        this.setAxisX({
            canvas,
            cWidth,
            cHeight,
            marginBottom,
            marginTop,
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

    // x轴
    setAxisX: function (obj) {
        console.log("canvas", obj.canvas);
        const canvas = obj.canvas;
        const lineX = this.toolFunc.makeLine([0, obj.cHeight - obj.marginBottom, obj.cWidth, obj.cHeight - obj.marginBottom], '#09f'); //x轴线
        canvas.add(lineX);
        this.setScaleX(obj);
        this.showTodayLine(obj);
    },

    // y轴
    setAxisY: function (obj) {
        const canvas = obj.canvas;
        const lineY = this.toolFunc.makeLine([obj.marginLeft, obj.marginTop, obj.marginLeft, obj.cHeight], '#09f');
        this.setScaleY(obj);
        canvas.add(lineY);
    },

    // 设置x轴刻度
    setScaleX: function (obj) {
        // console.log(this);
        // console.log("111",obj,canvas);
        const canvas = obj.canvas;
        let arr = [];
        const scaleArr = this.calculateScale(arr, obj.totalDays, obj.axisStartDate); //递归得出刻度数值
        const len = scaleArr.length;
        const w = obj.cWidth - obj.marginLeft;
        for (let i = 0; i < len; i++) {
            const element = scaleArr[i];
            let l = 0;
            for (let j = 0; j <= i; j++) {
                l += scaleArr[j].day;
            }
            const newDate = new Date(element.date.replace('/-/g', '/'));
            const month = newDate.getMonth() + 1;
            if (month === 12) {
                // 坐标轴添加年份指示
                canvas.add(this.toolFunc.makeText((newDate.getFullYear() + 1).toString(), {
                    left: obj.marginLeft + (w / obj.totalDays) * (l - 5),
                    top: obj.cHeight - obj.marginBottom + 18
                }));
            }
            canvas.add(this.toolFunc.makeLine([obj.marginLeft + (w / obj.totalDays) * l, obj.cHeight - obj.marginBottom, obj.marginLeft + (w / obj.totalDays) * l, obj.cHeight - obj.marginBottom - 8], '#09f'));
            canvas.add(this.toolFunc.makeText(month.toString() + '月', {
                left: obj.marginLeft + (w / obj.totalDays) * (l - element.day / 1.5),
                top: obj.cHeight - obj.marginBottom + 5
            }));
        }
    },

    calculateScale: function (arr, totalDays, axisStartDate) {
        let monthDay = this.toolFunc.getMonthDate(axisStartDate);
        if (totalDays > monthDay) {
            // if (totalDays > 0) { // 注意边界条件
            let obj = {
                date: axisStartDate,
                day: monthDay
            };
            totalDays -= monthDay;
            axisStartDate = this.toolFunc.getAddDate(axisStartDate, monthDay);
            arr.push(obj);
            this.calculateScale(arr, totalDays, axisStartDate);
            return arr;
        }
    },

    // 显示今日日期虚线
    showTodayLine: function (obj) {
        console.log("showTodayLine", obj);
        const today = this.toolFunc.getToday();
        const axisStartDate = obj.axisStartDate;
        const l = this.toolFunc.calculateRangeDays(axisStartDate, today);
        const t = obj.totalDays;
        const w = obj.cWidth - obj.marginLeft;
        const canvas = obj.canvas;
        console.log(w, l, t);
        canvas.add(this.toolFunc.makeDashedLine([(l / t) * w + obj.marginLeft, obj.cHeight - obj.marginBottom, (l / t) * w + obj.marginLeft, obj.marginTop], '#09f'));
        canvas.add(this.toolFunc.makeText(today, {
            left: (l / t) * w + obj.marginLeft - 28,
            top: obj.marginTop - 12
        }));
    },

    // 设置y轴刻度
    setScaleY: function (obj) {
        const {
            canvas,
            cHeight,
            marginTop,
            marginLeft,
            marginBottom,
            buildLayers
        } = obj;
        const h = cHeight - marginBottom - marginTop;

        for (let i = 1; i <= buildLayers; i++) {
            canvas.add(this.toolFunc.makeLine([marginLeft, (cHeight - marginBottom) - (i / buildLayers) * h, marginLeft + 5, (cHeight - marginBottom) - (i / buildLayers) * h], '#09f'));
            canvas.add(this.toolFunc.makeText(i.toString(), {
                left: marginLeft - 15,
                top: (cHeight - marginBottom) - (i / buildLayers) * h + 2
            }));
        }
    },

    // 设置每楼层状态显示（工期提前或延误）
    setFloorState: function (obj) {
        //自定义楼层状态类型
        const {
            canvas,
            cHeight,
            marginBottom,
            marginTop,
            projectName,
            buildLayers,
            buildSequence
        } = obj;
        const that = this;
        const h = cHeight - marginBottom - marginTop;
        const LabeledRect = this.toolFunc.customFloor();
        for (let i = 1; i <= buildLayers; i++) {
            const temp = new LabeledRect({
                width: 30,
                height: h / buildLayers,
                left: 0,
                top: (cHeight - marginBottom) - (i / buildLayers) * h,
                buildSequence: buildSequence,
                floor: i,
                type: 'floorState'
            })
            canvas.add(temp);
        }
        // canvas.on('mouse:down', function (options) {
        //     console.log(options.e.clientX, options.e.clientY, options.target);
        //     if (options.target) {
        //         if (options.target.type === 'floorState') {
        //             console.log('floorState', options.target);
        //             that.showFloorState({
        //                 projectName
        //             });
        //             // options.target.animate('left', '+=50', {
        //             //     onChange: canvas.renderAll.bind(canvas),
        //             // });
        //         }
        //     }
        // });
    },

    showFloorState: function (obj) {
        // 显示当前选中楼层延期或提前的进度状态
        console.log(obj.projectName);
    },

    // 根据数据展示进度计划
    showPlan: function (obj) {
        console.log("进度计划", obj.randerData);
        const {
            canvas,
            axisStartDate,
            totalDays,
            randerData: {
                projectName,
                buildSequence,
                buildLayers,
                scheduleList
            }
        } = obj;
        //axisStartDate; //坐标轴初始日期
        const cWidth = canvas.width;
        const cHeight = canvas.height;
        const marginTop = this.marginTop; //顶部留白
        const marginBottom = this.marginBottom; //底部留白
        const marginLeft = this.marginLeft; //左侧留白
        // console.log("showPlan totalDays",totalDays);

        const len = scheduleList.length;
        for (let i = 0; i < len; i++) {
            this.addSinglePlan({
                canvas,
                cWidth,
                cHeight,
                marginTop,
                marginBottom,
                marginLeft,
                axisStartDate,
                totalDays,
                projectName,
                buildSequence,
                buildLayers,
                data: scheduleList[i],
            });
        }
    },

    addSinglePlan: function (obj) {
        // console.log("AddSinglePlan",obj.data);
        const planType = obj.data.planType;
        switch (planType) {
            case 'line':
                this.addPlanLine(obj); //点线图（按楼层划分）
                break;
            case 'rect':
                this.addPlanRect(obj); //块 （无楼层）
                break;
            default:
                console.log('数据错误，没有匹配到正确类型');
                break;
        }
    },

    addPlanLine: function (obj) {
        const {
            canvas,
            data,
            buildSequence,
            axisStartDate,
            totalDays,
            cWidth,
            marginLeft,
            cHeight,
            marginBottom,
            marginTop,
            buildLayers
        } = obj; //解构
        const that = this;
        const pointList = data.pointList;

        const w = cWidth - marginLeft; //坐标轴实际刻度长
        const h = cHeight - marginBottom - marginTop;
        const PlanPoint = this.toolFunc.customPlanPoint();

        pointList.forEach(item => {
            const t = that.toolFunc.calculateRangeDays(axisStartDate, item.date);
            const left = (t / totalDays) * w + marginLeft;
            const half = (h / buildLayers) / 2;
            const top = cHeight - marginBottom - (item.floor / buildLayers) * h + half;
            const point = new PlanPoint({
                left: left,
                top: top,
                stroke: data.color,
                buildSequence: buildSequence,
                planName: data.planName,
                floor: item.floor,
                planDate: item.date,
                type: 'planPoint'
            });
            canvas.add(point);
        });
        console.log('addPlanLine', obj);
    },

    addPlanRect: function (obj) {
        console.log('addPlanRect', obj);
    },

    // 添加事件（仅在canvas初次加载时添加,防止重复添加导致的bug）
    addEvent: function(canvas) {
        const that = this;
        canvas.on('mouse:down', function (options) {
            console.log(options.e.clientX, options.e.clientY, options.target);
            if (options.target) {
                switch (options.target.type) {
                    case 'floorState':
                        {
                            console.log('floorState', options.target);
                        }
                        break;
                    case 'planPoint':
                        {
                            console.log('planPoint', options.target);
                            // 弹出框，进行数值调整
                            // 更新本地数据
                            // 上传数据
                            // 上传数据成功后改变对象位置
                        }
                        break;
                    default:
                        console.log('未匹配类型');
                        break;
                }
            }
        });
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

        //虚线
        makeDashedLine: function (coords, color = '#ccc') {
            return new fabric.Line(coords, {
                stroke: color,
                strokeDashArray: [6, 3],
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
            // console.log(dateString1, dateString2);
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
        getAddDate: function (date, days) {
            const newDate = new Date(date.replace('/-/g', '/'));
            newDate.setDate(newDate.getDate() + days);
            const month = newDate.getMonth() + 1;
            const day = newDate.getDate();
            const time = newDate.getFullYear() + "-" + month + "-" + day;
            // console.log(time);
            return time;
        },

        // 获取该月份天数
        getMonthDate: function (date) {
            const newDate = new Date(date.replace('/-/g', '/'));
            const month = newDate.getMonth() + 1;
            const d = new Date(newDate.getFullYear(), month, 0);
            return d.getDate();
        },

        // 获取日期所在月第一日
        getFirstDate: function (startDate) {
            const newDate = new Date(startDate.replace('/-/g', '/'));
            const month = newDate.getMonth() + 1;
            const firstDate = newDate.getFullYear() + '-' + month + '-' + '01';
            return firstDate;
        },

        // 自定义楼层状态类型
        customFloor: function () {
            const LabeledRect = fabric.util.createClass(fabric.Rect, {
                type: 'labeledRect',
                initialize: function (options = {}) {
                    this.callSuper('initialize', options);
                    this.set('buildSequence', options.buildSequence || '');
                    this.set('floor', options.floor || '');
                    this.set('type', options.type || 'floorState');
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
                        buildSequence: this.get('buildSequence'),
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
        },

        // 自定义任务计划点类型
        customPlanPoint: function () {
            const PlanPoint = fabric.util.createClass(fabric.Circle, {
                type: 'PlanPoint',
                initialize: function (options = {}) {
                    this.callSuper('initialize', options);
                    this.set('buildSequence', options.buildSequence || '');
                    this.set('planName', options.planName || '');
                    this.set('floor', options.floor || '');
                    this.set('planDate', options.planDate || '');
                    this.set('type', options.type || 'planPoint');
                    this.set({
                        fill: '#ccc',
                        originX: 'center',
                        originY: 'center',
                        stroke: options.stroke || '#0c0',
                        radius: 6,
                        strokeWidth: 1,
                        selectable: false
                    });
                },
                toObject: function () {
                    return fabric.util.object.extend(this.callSuper('toObject'), {
                        buildSequence: this.get('buildSequence'),
                        planName: this.get('planName'),
                        floor: this.get('floor'),
                        planDate: this.get('planDate'),
                        type: this.get('type'),
                    });
                },
                _render: function (ctx) {
                    this.callSuper('_render', ctx);
                    // ctx.fillStyle = '#333';
                }
            });
            return PlanPoint;
        },

        // 获取今日日期
        getToday: function () {
            var myDate = new Date();
            var year = myDate.getFullYear();
            var month = myDate.getMonth() + 1;
            var day = myDate.getDate();
            var today = year + '-' + month + '-' + day;
            return today;
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
