var wishlist=[],version,uid,export_time,date

function get_item_id(callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('application/json');
    xhr.open('GET', 'data/id-en2chs.json', false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var item_id_list = JSON.parse(xhr.responseText);
            callback(item_id_list);
        } else if (xhr.readyState == 4) {
            return callback(null);
        }
    };
    xhr.send(null);
};

function save(jsonfile) {
    const jsonstring = JSON.stringify(jsonfile, null, 4);
    const blob = new Blob([jsonstring], { type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Wishes-${uid}-${date}.json`;
    a.textContent = 'Download JSON Data';
    document.body.appendChild(a);

    a.click();
    
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    document.getElementById('number').value = '';
    document.getElementById('uidInput').style.display = 'none';
    wishlist = [];
}

function convert() {
    for (let i = 0, len = wishlist.length; i < len; i++) {
        for (let j = 0; j < len - i - 1; j++) {
            if (wishlist[j]['time'] > wishlist[j + 1]['time']) {
                [wishlist[j], wishlist[j + 1]] = [wishlist[j + 1], wishlist[j]];
            }
        }
    }

    get_item_id(function (item_id_list) {
        if (item_id_list) {
            for (let i = 0; i < wishlist.length; i++) {
                const name = wishlist[i]['name'];
                const item_id = item_id_list[name].toString();
                wishlist[i]['id'] = (1665723900010000001n + BigInt(i)).toString();
                wishlist[i]['count'] = '1';
                wishlist[i]['item_id'] = item_id;
                wishlist[i]['name'] = item_id_list[item_id];
                wishlist[i]['item_type'] = wishlist[i]['item_type'] == 'Character' ? '角色' : '武器';
            }
        } else {
            console.error("Failed to fetch item_id_list");
        }
    });

    let records = {"info": {
        "uid": uid,
        "lang": "zh-cn",
        "export_timestamp": Math.floor(export_time.getTime() / 1000),
        "export_app": "Paimon.moe",
        "export_app_version": version.toString(),
        "uigf_version": "v2.4",
        "region_time_zone": 8
    }, "list": wishlist};
    console.log(records);

    save(records);
};

function input_uid() {
    uid = document.getElementById("number").value;
    if (!uid) {
        alert("请输入uid!无uid的数据无法导入到其他程序中。");
    } else {
        convert();
    }
}

document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const reader = new FileReader();
        reader.onload = function (event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            try {
                const sheetNames = workbook.SheetNames.slice(0, 4);
                sheetNames.forEach(sheetName => {
                const columns = ['Type', 'Name', 'Time', '⭐'];
                const keys = { 'Type': 'item_type', 'Name': 'name', 'Time': 'time', '⭐': 'rank_type' }
                const gacha_type = { "Character Event": '301', "Weapon Event": '302', "Standard": '200', "Beginners\' Wish": '100' };
                const worksheet = workbook.Sheets[sheetName];
                var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                jsonData = jsonData.map(row => {
                    const selectedRow = {};
                    columns.forEach(column => {
                        selectedRow[keys[column]] = row[jsonData[0].indexOf(column)].toString();
                        selectedRow['uigf_gacha_type'] = gacha_type[sheetName];
                        selectedRow['gacha_type'] = gacha_type[sheetName];
                    });
                    return selectedRow;
                });
                wishlist = wishlist.concat(jsonData.slice(1,));
            });
            const infosheet = workbook.Sheets['Information'];
            version = infosheet['B2'].v;
            export_time = new Date(infosheet['B3'].v);
            date = infosheet['B3'].v.slice(2,10);
            date = date.replaceAll('-','.');
            document.getElementById('uidInput').style.display = 'block';
            } catch (error) {
                alert("转换失败：提交的Excel文件数据有误，它可能并非是从Paimon.moe导出的。");
            }
            
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("请上传Excel文件（.xlsx、.xls）");
    }
});