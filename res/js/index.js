$(function () {

    //设置任务显示列表位置
    function setListPosition() {
        const listDom = $('.pick-list');
        const canvas = $('#schedule');
        const offset = canvas.offset();
        const {top,left} = offset;
        listDom.css({
            "top": top+100,
            "left": left+50
        });
        listDom.show();
    }


    function getDate(buildSequence = '#1') {
        const p = getProjectName() || '中山项目';
        const b = buildSequence;

        axios.get('../../mock/buildDate.json', {
            params: {
                ProjectName: p,
                BuildSequence: b
            }
        }).then(function (response) {
            // console.log(response.data);
            const isInit = response.data.isInit; //是否已经进行过初始化
            isInit ? renderSchedule(response.data) : showInitForm();
        }).catch(function (err) {
            console.log(err);
        })
    }

    function getProjectName() {
        return '中山项目';
    }

    function renderSchedule(data) {
        //此处先清空画布，然后根据数据生成图表（计划图表）
        console.log(data);
        const sche = new Schedule('schedule', data);
        sche.init();
    }

    function showInitForm() {
        //显示计划初始化表格
        $('#init-form').show();
    }

    function getEndDate(startDate, template) {
        const endDate = '2020-1-15';
        return endDate;
    }

    // 根据模板获取楼层数（实际情况未知）
    function getBuildLayersByTemplate(template) {
        return 30;
    }

    // 根据开始日期及模板生成各进度计划数据
    function getScheduleListByTemplate(startDate, template) {
        const colorPalette = [
            '#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80',
            '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
            '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
            '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089'
        ];// echarts默认模板颜色
        return [{
                "color": "#09f",
                "planName": "砌体工程",
                "planType": "line",
                "pointList": [{
                        "floor": 1,
                        "date": "2019-01-13"
                    },
                    {
                        "floor": 2,
                        "date": "2019-01-28"
                    },
                    {
                        "floor": 3,
                        "date": "2019-02-13"
                    },
                    {
                        "floor": 4,
                        "date": "2019-02-20"
                    },
                    {
                        "floor": 5,
                        "date": "2019-02-28"
                    },
                    {
                        "floor": 6,
                        "date": "2019-03-08"
                    },
                    {
                        "floor": 7,
                        "date": "2019-03-13"
                    },
                    {
                        "floor": 8,
                        "date": "2019-03-23"
                    },
                    {
                        "floor": 9,
                        "date": "2019-04-13"
                    }
                ]
            },
            {
                "color": "#f09",
                "planName": "主体封顶",
                "planType": "line",
                "pointList": [{
                        "floor": 1,
                        "date": "2019-03-13"
                    },
                    {
                        "floor": 2,
                        "date": "2019-03-28"
                    }
                ]
            }
        ];
    }

    function calculate(startDate, template, buildSequence) {
        //根据开始日期及模板生成标准格式数据
        var projectName = getProjectName();
        const data = {
            "isInit": true,
            "renderData": {
                "startDate": startDate,
                "endDate": getEndDate(startDate, template),
                "projectName": projectName,
                "buildSequence": buildSequence,
                "buildLayers": getBuildLayersByTemplate(template),
                "scheduleList": getScheduleListByTemplate(startDate, template)
            }
        };
        return data;
    }

    /**
     *
     *
     * @param {object} startDate 开始日期
     * @param {string} template 模板
     * @param {string} buildSequence 楼栋
     */
    function initSchedule(startDate, template, buildSequence) {
        //根据开始日期及模板生成标准格式数据，然后根据数据渲染图表
        const start = dateFormat(startDate);
        const data = calculate(start, template, buildSequence);
        renderSchedule(data);
    }

    function dateFormat(dateObj) {
        console.log(dateObj);
        const year = dateObj.year;
        let month = dateObj.month;
        let day = dateObj.date;
        // if (month < 10) {
        //     month = '0' + month;
        // }
        // if (day < 10) {
        //     day = '0' + day;
        // }
        let date = year + '-' + month + '-' + day;
        return date;
    }


    //时间插件
    let startDate = {};

    layui.use('laydate', function () {
        const laydate = layui.laydate;

        //执行一个laydate实例
        laydate.render({
            elem: '#startDate',
            done: function (value, date) {
                //date格式--{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
                startDate = date;
            }
        });
    });

    $('body').on('change', '#buildSequence', function () {
        var buildSequence = $(this).val();
        //获取数据
        getDate(buildSequence);
    });

    $('body').on('click', '#initCanvasBtn', function (e) {
        e.preventDefault();
        if (startDate === {}) {
            alert('请选择起始日期');
            return;
        }
        var template = $('#template').val();
        var buildSequence = $('#buildSequence').val();
        // console.log(template, typeof template);
        initSchedule(startDate, template, buildSequence);
        $('#init-form').hide();
    });

    // $('.pick-list').on('click', '.list-item', function (e) { 
    //     e.preventDefault();
    //     console.log($(this).find('.plan-name').html());
    // })

    // 进入页面时，获取默认数据（暂定为楼栋#1），生成图表
    getDate();
    setListPosition();

});