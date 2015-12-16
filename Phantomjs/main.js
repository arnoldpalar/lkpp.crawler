//https://lpse.lkpp.go.id/eproc4/dt/lelang?kategori=PEKERJAAN_KONSTRUKSI&draw=3&_=1450173697323

var fs = require('fs');
var nofData = 0;

var jsonSource = fs.read('projectsList.json');
var resultObject = JSON.parse(jsonSource);

if(resultObject.data){
    console.log('Getting projects list...');
    console.log('Total: ' + resultObject.data.length);

    nofData = resultObject.data.length;
    for(var i = 0; i < nofData; i++){
        var item = resultObject.data[i];

        var project = {};
        project.code = item[0];
        project.name = item[1];

        getProjectDetails(project);
    }
} else {
    console.log('Projects list does not exist in this source : ' + jsonSource)
}

function getProjectDetails(project){
    var page = require('webpage').create();

    console.log('[Fetching Project Details] Code: ' + project.code + ', Name: ' + project.name);
    page.open('https://lpse.lkpp.go.id/eproc4/lelang/'+ project.code +'/pengumumanlelang', function(status){
        if(status === 'success'){
            page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js", function(){
                page.includeJs('https://maps.googleapis.com/maps/api/js?key=AIzaSyBW5DNreOlH_QzEgu-BZZ7E1rZsldg4-dI', function(){
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
                                case 'Tahap Lelang Saat ini' :{
                                    if ($(this).find('td:first a').length){
                                        project.biddingStepsLink = $(this).find('td:first a:first').attr('href');
                                    } else
                                        project.currentBiddingPhase = txtVal; break;
                                }
                                case 'Instansi' :
                                    project.organizer = txtVal; break;
                                case 'Satuan Kerja' :
                                    project.workUnit = txtVal; break;
                                case 'Kategori' :
                                    project.category = txtVal; break;
                                case 'Metode Pengadaan' : {
                                    if(!project.method)
                                        project.method = {};

                                    var td = $(this).find('td');
                                    if (td) {
                                        project.method.biddingMethod = td.eq(0).text();
                                        project.method.qualificationMethod = td.eq(1).text();
                                    }

                                    break;
                                }
                                case 'Metode Dokumen' : {
                                    if(!project.method)
                                        project.method = {};

                                    var td = $(this).find('td');
                                    if (td) {
                                        project.method.documentMethod = td.eq(0).text();
                                        project.method.evaluationMethod = td.eq(1).text();
                                    }

                                    break;
                                }
                                case 'Tahun Anggaran' :
                                    project.fiscalYear = txtVal; break;
                                case 'Nilai Pagu Paket' : {
                                    var td = $(this).find('td');
                                    if (td) {
                                        project.price = {
                                            ceiling: td.eq(0).text(),
                                            estimated: td.eq(1).text()
                                        };
                                    }

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
                                case 'Syarat Kualifikasi' : {
                                    if($(this).find('td:first table').length){
                                        project.qualification = {
                                            permits: [],
                                            requirements: []
                                        };

                                        $(this).find('td:first > table > tbody > tr:first td:eq(1) table tbody tr').slice(1).each(function(){

                                            var td = $(this).find('td');
                                            if (td) {
                                                project.qualification.permits.push({
                                                    code: td.eq(0).text(),
                                                    name: td.eq(1).text()
                                                });
                                            }
                                        });

                                        $(this).find('td:first > table > tbody > tr').slice(1).each(function(){

                                            var td = $(this).find('td').eq(1);
                                            if(td){
                                                var br = td.find('br').replaceWith('[br]');
                                                var strs = td.text().split('[br]');
                                                project.qualification.requirements.push({
                                                    code: strs[0],
                                                    name: strs[1]
                                                });
                                            }
                                        });

                                    } else if ($(this).find('td:first a').length){
                                        project.qualification = {
                                            link : $(this).find('td:first a:first').attr('href')
                                        }
                                    }

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

                    if(--nofData === 0){
                        phantom.exit();
                    }
                });
            });

        } else {
            console.log('Failed to fetch project details with code ' + project.code + ', status: ' + status);
        }
    });
}
