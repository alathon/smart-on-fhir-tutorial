function defaultPatient(){
  return {
    fname: '',
    lname: '',
    gender: '',
    birthdate: ''
  };
}

var fetchEHRData = function fetchEHRData() {
  var vm = this;
  var ret = $.Deferred();
  var onError = function() {
    ret.reject();
  };

  var onReady = function(smart) {
    if (smart.hasOwnProperty('patient')) {
      var patient = smart.patient;
      var pt = patient.read();
      var medication = smart.patient.api.fetchAll({
        type: 'MedicationOrder'
      });

      $.when(pt, medication).fail(onError);

      $.when(pt, medication).done(function(patient, medication) {

        var gender = patient.gender;

        var fname = '';
        var lname = '';

        if (typeof patient.name[0] !== 'undefined') {
          fname = patient.name[0].given.join(' ');
          lname = patient.name[0].family.join(' ');
        }

        var p = defaultPatient();

        p.medications = [];
        for(var i = 0; i < medication.length; i++) {
          var med = medication[i];
          if (!med.meta || !med.medicationCodeableConcept || !med.dosageInstruction || !med.dosageInstruction.length) continue;

          if (med.status !== 'active') continue;

          var data = { text: med.medicationCodeableConcept.text, dosage: med.dosageInstruction[0].text, lastUpdated: med.meta.lastUpdated };
          p.medications.push(data);
        }

        p.birthdate = patient.birthDate;
        p.gender = gender;
        p.fname = fname;
        p.lname = lname;

        ret.resolve(p);
      });
    }
  };
  FHIR.oauth2.ready(onReady, onError);
  return ret;
};

var fetchSCAUTData = function fetchSCAUTData() {
  return axios.get(`https://dev-gateway.scaut.dk/9DnRb5LDxx7Dp`)
  .then(response => {
    var data = response.data.medicationList.fields[0].medications;
    return data;
  });
};

var app = new Vue({
  el: '#app',
  data() {
    return {
      scautMedications: [],
      ehrMedications: [],
      fname: '',
      lname: '',
      gender: '',
      birthdate: ''
    }
  },

  created() {
    var vm = this;
    var scautData = fetchSCAUTData.apply(this);
    var ehrData = fetchEHRData.apply(this);
    Promise.all([scautData, ehrData])
      .then(function(results) {
        var scautMeds = results[0];
        var patient = results[1];
        console.log(patient);
        vm.scautMedications = scautMeds;
        vm.ehrMedications = patient.medications;
        vm.fname = patient.fname;
        vm.lname = patient.lname;
        vm.gender = patient.gender;
        vm.birthdate = patient.birthdate;
        $('#holder').show();
        $('#loading').hide();
      })
      .catch(e => {
        console.log(e);
      })
  }
});
