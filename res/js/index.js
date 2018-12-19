$(function () {

    function getDate(projectName,buildNumber) {
        const p = projectName || '中山项目';
        const b = buildNumber || '#1';
       
        axios.get('../../mock/buildDate.json', {
            params: {
                ProjectName: p,
                BuildNumber: b
            }
        }).then(function (response) {
            console.log(response.data);

            console.log(response.status);
            console.log(response.statusText);
            console.log(response.headers);
            console.log(response.config);

            const isInit = response.data.isInit;
            isInit ? randerSchedule(response.data.randerData) : showInitForm();
        }).catch(function (err) {
            console.log(err);
        })
    }

    getDate();


    $('body').on('click', '#buildSelectBtn', function (e) {
        e.preventDefault();
        //ajax请求数据
        var buildNumber = $('#buildNumber').val();
        //清空画布
        //获取数据
        getDate('中山项目', buildNumber);
    })

    function randerSchedule(data) {
        console.log(data);
    }

    function showInitForm() {
        //显示计划初始化表格
        $('#init-form').show();
    }

    function calculate(startDate, template) {
        //根据开始日期及模板生成标准格式数据
        const data = {};
        return data;
    }

    function initSchedule(startDate, template) {
        //根据开始日期及模板生成标准格式数据，然后根据数据渲染图表
        const data = calculate(startDate,template);
        randerSchedule(data);
    }





    //时间插件
    let startDate = {};

    layui.use('laydate', function () {
        const laydate = layui.laydate;

        //执行一个laydate实例
        laydate.render({
            elem: '#startDate',
            done: function (value, date) {
                // console.log(value); //得到日期生成的值，如：2017-08-18
                // console.log(date); //得到日期时间对象：{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
                startDate = date;
            }
        });
    });

    $('body').on('click', '#initCanvasBtn', function (e) {
        e.preventDefault();
        if (startDate === {}) {
            alert('请选择起始日期');
            return;
        }
        var template = $('#template').val();

        console.log(template, typeof template);
        initSchedule(startDate, template);
    });




});