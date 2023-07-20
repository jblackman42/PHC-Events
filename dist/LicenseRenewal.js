class LicenseRenewal extends HTMLElement {
  constructor() {
    super();

    const urlParams = new URLSearchParams(window.location.search);
    this.guid = urlParams.get('guid');
    this.id = urlParams.get('id');
    
    const invalidURLRedirectURL = this.getAttribute('invalidURLRedirectURL')
    if (!this.guid || !this.id) {
      window.location = invalidURLRedirectURL;
    }

    // this.fetchURL = 'https://phc.events';
    this.fetchURL = this.getAttribute('fetchURL') || 'https://phc.events';
    this.draw();
  }

  draw = () => {
    this.innerHTML = `
      <div class="container">
        <h2>Update License Form</h2>
        <form id="update-license-form">
          <label for="license">Driver's License #:</label>
          <input type="text" id="license" name="license" required>
          
          <label for="exp-date">Expiration Date:</label>
          <input type="date" id="exp-date" name="exp-date" required>

          <label for="state">Issued State:</label>
          <select id="state" name="state" required>
            <option value="" selected disabled>--Please choose a state--</option>
            <option value="AL">Alabama</option>
            <option value="AK">Alaska</option>
            <option value="AZ">Arizona</option>
            <option value="AR">Arkansas</option>
            <option value="CA">California</option>
            <option value="CO">Colorado</option>
            <option value="CT">Connecticut</option>
            <option value="DE">Delaware</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="HI">Hawaii</option>
            <option value="ID">Idaho</option>
            <option value="IL">Illinois</option>
            <option value="IN">Indiana</option>
            <option value="IA">Iowa</option>
            <option value="KS">Kansas</option>
            <option value="KY">Kentucky</option>
            <option value="LA">Louisiana</option>
            <option value="ME">Maine</option>
            <option value="MD">Maryland</option>
            <option value="MA">Massachusetts</option>
            <option value="MI">Michigan</option>
            <option value="MN">Minnesota</option>
            <option value="MS">Mississippi</option>
            <option value="MO">Missouri</option>
            <option value="MT">Montana</option>
            <option value="NE">Nebraska</option>
            <option value="NV">Nevada</option>
            <option value="NH">New Hampshire</option>
            <option value="NJ">New Jersey</option>
            <option value="NM">New Mexico</option>
            <option value="NY">New York</option>
            <option value="NC">North Carolina</option>
            <option value="ND">North Dakota</option>
            <option value="OH">Ohio</option>
            <option value="OK">Oklahoma</option>
            <option value="OR">Oregon</option>
            <option value="PA">Pennsylvania</option>
            <option value="RI">Rhode Island</option>
            <option value="SC">South Carolina</option>
            <option value="SD">South Dakota</option>
            <option value="TN">Tennessee</option>
            <option value="TX">Texas</option>
            <option value="UT">Utah</option>
            <option value="VT">Vermont</option>
            <option value="VA">Virginia</option>
            <option value="WA">Washington</option>
            <option value="WV">West Virginia</option>
            <option value="WI">Wisconsin</option>
            <option value="WY">Wyoming</option>

          </select>

          <label for="license-file">Picure of Front of License:</label>
          <input type="file" id="fileInput1" required>
          <label for="license-file">Picture of Back of License:</label>
          <input type="file" id="fileInput2" required>

          <input type="submit" value="Submit">

          <p id="form-message"></p>
        </form>
      </div>
    `;

    const updateLicenseFormDOM = document.getElementById('update-license-form');
    updateLicenseFormDOM.addEventListener('submit', this.handleSubmit)
  }

  showError = (error) => {
    const formMessage = document.getElementById('form-message');
    formMessage.classList.add('error');
    formMessage.textContent  = error;
    formMessage.style.display = 'block';
    formMessage.style.visibility = 'visible';
  }

  showMessage = (message) => {
    const formMessage = document.getElementById('form-message');
    formMessage.classList.remove('error');
    formMessage.textContent  = message;
    formMessage.style.display = 'block';
    formMessage.style.visibility = 'visible';
  }
  
  hideMessage = () => {
    const formMessage = document.getElementById('form-message');
    formMessage.classList.remove('error');
    formMessage.textContent = '';
    formMessage.style.display = 'none';
    formMessage.style.visibility = 'hidden';
  }

  handleSubmit = async (e) => {
    e.preventDefault();

    const showError = this.showError;
    const showMessage = this.showMessage;
    const draw = this.draw;

    const requestURL = this.fetchURL;
    const expiration_id = this.id;
    const licenseInputDOM = document.getElementById('license');
    const exoDateInputDOM = document.getElementById('exp-date');
    const stateInputDOM = document.getElementById('state');
    
    let fileInput1 = document.getElementById('fileInput1');
    let fileInput2 = document.getElementById('fileInput2');

    // update record in MP
    // --------------------------------------------------------------------------------------------------
  
    const updatedLicense = {
      'Expiration_ID': this.id,
      'Expiration_GUID': this.guid,
      'Driver_License_#': licenseInputDOM.value,
      'License_Expiration': new Date(exoDateInputDOM.value).toISOString(),
      'State_Issuing_Authority': stateInputDOM.value
    };
  
    const newLicense = await axios({
      method: 'put', //put means update
      url: `${requestURL}/api/widgets/expirations`, //get from swagger
      data: {
        updatedLicense: updatedLicense
      },
    })
      .then(response => response.data)
      .catch(err => {
        console.error(err);
        showError('Something went wrong. Please try again or contact IT');
      })
  
    // upload license files to mp
    // --------------------------------------------------------------------------------------------------
  
    // Create two FileReader instances
    let reader1 = new FileReader();
    let reader2 = new FileReader();
  
    async function uploadFiles() {
      // Create the FormData instance
      const formData = new FormData();
  
      const todayString = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`
      const renamedFile1 = new File([fileInput1.files[0]], `License Front ${todayString}`, {type: fileInput1.files[0].type});
      const renamedFile2 = new File([fileInput2.files[0]], `License Back ${todayString}`, {type: fileInput2.files[0].type});
  
      // Append the two files
      formData.append('file1', renamedFile1);
      formData.append('file2', renamedFile2);
  
      // Make the axios request
      const records = await axios({
          method: 'post',
          url: `${requestURL}/api/widgets/files/expirations?id=${expiration_id}`, //get from swagger
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(response => response.data)
      .catch(err => {
          console.error(err);
          showError('Something went wrong. Please try again or contact IT');
      });
  
      draw();
      showMessage('Record Updated Successfully. You can now close this page!')
    }
  
    // Define a function to be called when both files have been read
    let filesRead = 0;
    function fileRead() {
        filesRead++;
        if (filesRead === 2) {
            // Both files have been read - upload them
            uploadFiles();
        }
    }
  
    // Define the onload function for both readers
    reader1.onload = fileRead;
    reader2.onload = fileRead;
  
    // Start reading the files
    if (fileInput1.files.length > 0) {
        reader1.readAsText(fileInput1.files[0]);
    }
    if (fileInput2.files.length > 0) {
        reader2.readAsText(fileInput2.files[0]);
    }
  }
}

customElements.define('phc-license-renewal', LicenseRenewal);