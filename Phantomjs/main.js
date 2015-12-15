var fs = require('fs');
var page = require('webpage').create();
/*
page.open('https://lpse.lkpp.go.id/eproc4/lelang', function(status) {

    console.log("Status: " + status);

    if(status === "success") {
        //page.render('example.png');

        page.viewportSize = {
            width: 1366,
            height: 768
        };

        page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js", function() {
            page.evaluate(function() {
                $("table.tbllelang > tbody > tr").each(function(idx){
                    var cols = $(this).find("td");
                    var code = $(cols[0]).text();
                    var name = $(cols[1]).find('p > a:first').text();
                    console.log('code: ' + code + ', name: ' + name)
                });
            });
        });
    }

    phantom.exit();

});*/

/*page.open('https://lpse.lkpp.go.id/eproc4/dt/lelang?kategori=PEKERJAAN_KONSTRUKSI&draw=3&_=1450173697323', function(status){
    console.log('Status : ' + status);

    if(status === 'success'){
        var jsonSource = page.plainText;
        var resultObject = JSON.parse(jsonSource);

        if(resultObject.data){
            console.log('Getting projects list...');
            console.log('Total: ' + resultObject.data.length);

            getProjectsDetails(resultObject.data, 0);
        } else {
            console.log('Projects list does not exist in this source : ' + jsonSource)
        }

    }

});*/

var jsonSource = fs.read('projectsList.json');
var resultObject = JSON.parse(jsonSource);

if(resultObject.data){
    console.log('Getting projects list...');
    console.log('Total: ' + resultObject.data.length);

    getProjectsDetails(resultObject.data, 0);
} else {
    console.log('Projects list does not exist in this source : ' + jsonSource)
}

function getProjectsDetails(data, idx){
    if(idx >= data.length){
        phantom.exit();
        return;
    }

    var item = data[idx++];
    var project = {};
    project.code = item[0];
    project.name = item[1];

    var page = require('webpage').create();

    console.log('[Fetching Project Details] Code: ' + project.code + ', Name: ' + project.name);
    page.open('https://lpse.lkpp.go.id/eproc4/lelang/'+ project.code +'/pengumumanlelang', function(status){
        if(status === 'success'){
            page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js", function(){
                var project = page.evaluate(function() {
                    var project = {};

                    $('table.table:first tbody tr').each(function(){
                        var txtVal = $(this).find('td:first').text();
                        switch($(this).find('th:first').text()){
                            case 'Kode Lelang' :
                                project.code = txtVal; break;
                            case 'Nama Lelang' :
                                project.name = txtVal; break;
                            case 'Tanggal Pembuatan' :
                                project.date = txtVal; break;
                            case 'Lingkup pekerjaan' :
                                project.workScope = txtVal; break;
                            case 'Keterangan' :
                                project.desc = txtVal; break;
                            case 'Tahap Lelang Saat ini' :
                                project.currentBiddingPhase = txtVal; break;
                            case 'Instansi' :
                                project.organizer = txtVal; break;
                            case 'Satuan Kerja' :
                                project.workUnit = txtVal; break;
                            case 'Kategori' :
                                project.category = txtVal; break;
                            case 'Metode Pengadaan' : {
                                if(!project.method)
                                    project.method = {};

                                project.method.biddingMethod = $(this).find('td:first').text();
                                project.method.qualificationMethod = $(this).find('td:nth-child(2)').text();

                                break;
                            }
                            case 'Metode Dokumen' : {
                                if(!project.method)
                                    project.method = {};

                                project.method.biddingMethod = $(this).find('td:first').text();
                                project.method.qualificationMethod = $(this).find('td:nth-child(2)').text();

                                break;
                            }
                            case 'Tahun Anggaran' :
                                project.fiscalYear = txtVal; break;
                            case 'Nilai Pagu Paket' : {
                                project.price = {
                                    ceiling : $(this).find('td:first').text(),
                                    estimated : $(this).find('td:nth-child(2)').text()
                                };

                                break;
                            }
                            case 'Jenis Kontrak' : {
                                if(!project.contractType)
                                    project.contractType = {};

                                project.contractType.paymentMethod = $(this).find('td:first').text();

                                break;
                            }
                            case 'Pembebanan Tahun Anggaran' : {
                                if(!project.contractType)
                                    project.contractType = {};

                                project.contractType.fiscalYearImposition = $(this).find('td:first').text();

                                break;
                            }
                            case 'Sumber Pendanaan' : {
                                if(!project.contractType)
                                    project.contractType = {};

                                project.contractType.sourceOfFund = $(this).find('td:first').text();

                                break;
                            }
                            case 'Lokasi Pekerjaan' : {
                                project.locations = [];
                                $(this).find('td:first ul li').each(function(){
                                    project.locations.push({
                                        address: $(this).text()
                                    });
                                });

                                break;
                            }
                        }
                    });

                    return project;

                });

                var path = 'out/' + project.code + '.json';
                var content = JSON.stringify(project);

                console.log('[Writing Project] Code: ' + project.code + ', Name: ' + project.name);
                fs.write(path, content, 'w');

                getProjectsDetails(data, idx);
            });

        } else {
            console.log('Failed to fetch project details with code ' + project.code + ', status: ' + status);
            getProjectsDetails(data, idx);
        }
    });
}
