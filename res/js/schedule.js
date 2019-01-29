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
        const renderData = this.data.renderData;
        const axisStartDate = this.toolFunc.getFirstDate(renderData.startDate); //坐标轴初始日期
        const axisEndDate = this.toolFunc.getAddDate(renderData.endDate, 100); //坐标轴结束日期 （相对于计划结束日期又增加了100天）
        const totalDays = this.toolFunc.calculateRangeDays(axisStartDate, axisEndDate); //坐标轴总天数

        const canvas = this.getFabricCanvas(this.id);
        if (JSON.stringify(staticCanvas) === "{}") {
            //首次加载时注册事件
            this.addEvent(canvas, totalDays); //canvas事件
            this.addListEvent(canvas); //任务列表点击事件
        };
        staticCanvas = canvas; // 保存生成的fabric对象至全局变量staticCanvas

        this.clean(canvas);
        this.basicSetUp(canvas);
        // this.setAxis(canvas, this.data); // 此处可以优化，不需要将所有数据传入
        this.setAxis({
            canvas,
            projectName: renderData.projectName,
            buildLayers: renderData.buildLayers,
            buildSequence: renderData.buildSequence,
            startDate: renderData.startDate,
            endDate: renderData.endDate,
            axisStartDate,
            totalDays
        });
        this.showPlan({
            canvas,
            axisStartDate,
            totalDays,
            renderData
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
        //清除list
        const list = document.querySelectorAll('.pick-list .list-item');
        list.forEach(item => {
            if (!$(item).hasClass('show-all')) {
                $(item).remove();//同时也已经移除了绑定的事件
            }
        });
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
            canvas.add(this.toolFunc.makeLine([
                obj.marginLeft + (w / obj.totalDays) * l,
                obj.cHeight - obj.marginBottom,
                obj.marginLeft + (w / obj.totalDays) * l,
                obj.cHeight - obj.marginBottom - 8], '#09f'));
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
        canvas.add(this.toolFunc.makeDashedLine([
            (l / t) * w + obj.marginLeft,
            obj.cHeight - obj.marginBottom,
            (l / t) * w + obj.marginLeft,
            obj.marginTop], '#09f'));
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
            canvas.add(this.toolFunc.makeLine([
                marginLeft,
                (cHeight - marginBottom) - (i / buildLayers) * h,
                marginLeft + 5,
                (cHeight - marginBottom) - (i / buildLayers) * h], '#09f'));
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
        console.log("进度计划", obj.renderData);
        const {
            canvas,
            axisStartDate,
            totalDays,
            renderData: {
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
        const lineArr = that.getLineArr(obj);// 点与点之间连线
        const half = (h / buildLayers) / 2; // 每层所占高度的一半（用来设置点的纵坐标）
        pointList.forEach((item, index) => {
            const t = that.toolFunc.calculateRangeDays(axisStartDate, item.date);
            const left = (t / totalDays) * w + marginLeft;
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
            point.line1 = lineArr[index];
            point.line2 = lineArr[index + 1];
            canvas.add(point);
        });
        console.log('addPlanLine', obj);
        this.addPickList(data.color,data.planName);
    },

    addPlanRect: function (obj) {
        console.log('addPlanRect', obj);
    },

    // 添加多选任务列表
    addPickList: function (color,planName) {
        const listItem =
        `<div class="list-item">
            <span class="list-item-color" style="background-color: ${color}"></span>
            <span class="plan-name">${planName}</span>
        </div>`;

        $('.pick-list').append(listItem);
        console.log($(listItem));
        //注册事件
    },

    // 任务列表点击事件
    addListEvent: function(canvas) {
        const that = this;
        $('.pick-list').on('click', '.list-item', function (e) { 
            e.preventDefault();
            // console.log($(this).find('.plan-name').html());
            const planName = $(this).find('.plan-name').html();
            // console.log(canvas);
            if (planName === '显示全部') {
                that.toolFunc.displayAll({ canvas });
            } else {
                that.toolFunc.hide({ canvas, planName });
                that.toolFunc.display({ canvas, planName });
            }
            console.log('click event ok');
        });

        $('#close-floor-state-btn').on('click', function (e) {
            $('#floorState').hide();
            $('#schedule-detail-list p').remove();
        })
    },

    // 添加点与点之间的连线
    getLineArr: function (obj) {
        const {
            canvas,
            data,
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
        let arr = [];
        arr.push(null);
        pointList.forEach((item, index, array) => {
            if (index < array.length - 1) {
                const t = that.toolFunc.calculateRangeDays(axisStartDate, item.date);
                const left = (t / totalDays) * w + marginLeft;
                const half = (h / buildLayers) / 2;
                const top = cHeight - marginBottom - (item.floor / buildLayers) * h + half;

                const t2 = that.toolFunc.calculateRangeDays(axisStartDate, array[index + 1].date);
                const left2 = (t2 / totalDays) * w + marginLeft;
                const top2 = cHeight - marginBottom - (array[index + 1].floor / buildLayers) * h + half;
                // left,top起点坐标；left2,top2终点坐标；
                const line = that.toolFunc.makeDashedLine([left, top, left2, top2], data.color, [3, 2]);
                arr.push(line);
                canvas.add(line);
            }
        });
        arr.push(null);
        return arr;
    },


    // 添加事件（仅在canvas初次加载时添加,防止重复添加导致的bug）
    addEvent: function (canvas, totalDays) {
        const that = this;
        canvas.on('mouse:down', function (options) {
            // console.log(options.e.clientX, options.e.clientY, options.target);
            if (options.target) {
                switch (options.target.type) {
                    case 'floorState':
                        {
                            // console.log('floorState', options.target);
                            that.toolFunc.displayFloorState(options.target);
                        }
                        break;
                    case 'planPoint':
                        {
                            console.log('planPoint', options.target);
                            // 弹出框，进行数值调整
                            $('#changeDate #planName').text(options.target.planName);
                            $('#changeDate #planDate').text(options.target.planDate);
                            $('#changeDate #floor').text(options.target.floor);
                            $('#changeDate').show();
                            $('#changeDate-btn').off("click").on("click", function () {
                                //先清除再添加事件，保证事件只被注册一次（可能canvas上的计划点被点击多次才开始调整数值，此时若不清除，则会重复添加多次相同事件）
                                const days = $('#updateDate').val();
                                if (days) {
                                    that.movePosition({
                                        canvas,
                                        days,
                                        totalDays,
                                        target: options.target
                                    });
                                }
                                $('#updateDate').val(0);
                                $('#changeDate').hide();
                            });
                            // 更新本地数据
                            // 上传数据
                            // 上传数据成功后改变对象位置 canvas.renderAll()
                        }
                        break;
                    default:
                        console.log('未匹配类型');
                        break;
                }
            }
        });
    },

    // 调整位置(点)
    movePosition: function (obj) {
        const {
            canvas,
            days,
            totalDays,
            target
        } = obj;
        // console.log('弹出框', days);
        const daysNum = parseInt(days);
        const objects = canvas.getObjects();
        const chooseDate = target.planDate;
        objects.forEach(item => {
            if (item.planName === target.planName) {
                const rangeTime = this.toolFunc.calculateRangeDays(chooseDate, item.planDate); //被点击对象与当前遍历对象之间相差的日期
                if (rangeTime >= 0) {
                    //只有日期在点击对象日期之后的才会受到影响
                    //此处后期需添加根据楼层、施工顺序等特殊情况判断
                    const newDate = this.toolFunc.getAddDate(item.planDate, daysNum);
                    // console.log(item.planDate,newDate);
                    item.planDate = newDate;
                    const unit = (canvas.width - this.marginLeft) / totalDays; //单位时间（每日）长度
                    //点与点之间连线
                    item.line1 && item.line1.animate({
                        'x2': item.left + daysNum * unit
                    });
                    item.line2 && item.line2.animate({
                        'x1': item.left + daysNum * unit
                    });

                    if (daysNum >= 0) {
                        item.animate('left', '+=' + daysNum * unit, {
                            onChange: canvas.renderAll.bind(canvas),
                        });
                    } else {
                        item.animate('left', '-=' + (-daysNum) * unit, {
                            onChange: canvas.renderAll.bind(canvas),
                        });
                    }
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
        makeDashedLine: function (coords, color = '#ccc', strokeDashArray = [6, 3]) {
            return new fabric.Line(coords, {
                stroke: color,
                strokeDashArray,
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
        },

        // 隐藏单个plan
        hide: function (obj) {
            const { canvas, planName } = obj;
            const objects = canvas.getObjects();
            const typeArr = ['planPoint','planRect']; //后期应放在属性中
            objects.forEach(item => {
                if (typeArr.indexOf(item.type) !== -1) {
                    if (item.planName !== planName) {
                        item.set('opacity', 0).setCoords();
                        item.line1 && item.line1.set('opacity', 0).setCoords();
                        item.line2 && item.line2.set('opacity', 0).setCoords();
                    }
                }
            });
            canvas.requestRenderAll();
        },
        // 显示单个plan
        display: function (obj) {
            const { canvas, planName } = obj;
            const objects = canvas.getObjects();
            const typeArr = ['planPoint','planRect'];
            objects.forEach(item => {
                if (typeArr.indexOf(item.type) !== -1) {
                    if (item.planName === planName) {
                        item.set('opacity', 1).setCoords();
                        item.line1 && item.line1.set('opacity', 1).setCoords();
                        item.line2 && item.line2.set('opacity', 1).setCoords();
                    }
                }
            });
            canvas.requestRenderAll();
        },

        // 显示所有plan
        displayAll: function (obj) {
            const { canvas} = obj;
            const objects = canvas.getObjects();
            const typeArr = ['planPoint','planRect'];
            objects.forEach(item => {
                if (typeArr.indexOf(item.type) !== -1) {
                    item.set('opacity', 1).setCoords();
                    item.line1 && item.line1.set('opacity', 1).setCoords();
                    item.line2 && item.line2.set('opacity', 1).setCoords();
                }
            });
            canvas.requestRenderAll();
        },

        // 显示楼层进度状态
        displayFloorState: function (obj) {
            console.log(obj);
            console.log('添加弹窗');
            // 处理数据
            const { canvas, floor } = obj;
            const objects = canvas.getObjects();
            const typeArr = ['planPoint','planRect'];
            let infoArr = [];
            objects.forEach( item => {
                if (typeArr.indexOf(item.type) !== -1 && item.floor === floor) {
                    // 显示该楼层进度状态
                    const planName = item.planName;
                    const planDate = item.planDate;
                    const tempStr = `${planName}延期${planDate}`;
                    infoArr.push(tempStr);
                }
            });
            console.log(infoArr);

            $('#floor-number').html(floor);

            // 添加延期状态
            const wrap = $('#schedule-detail-list');
            $('#schedule-detail-list p').remove('.form-control-static');
            for (let i = 0; i < infoArr.length; i++) {
                const item = infoArr[i];
                const tempHtml = `<p class="form-control-static">${item}</p>`;
                wrap.append(tempHtml);
            }
            $('#floorState').show();
        },

    }
}
