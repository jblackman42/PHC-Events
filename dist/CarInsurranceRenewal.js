class CarInsurranceRenewal extends HTMLElement {
  constructor() {
    super();

    const urlParams = new URLSearchParams(window.location.search);
    this.guid = urlParams.get('guid');
    
    const invalidURLRedirectURL = this.getAttribute('invalidURLRedirectURL')
    if (!this.guid) {
      window.location = invalidURLRedirectURL;
    }

    // this.fetchURL = 'https://phc.events';
    this.fetchURL = this.getAttribute('fetchURL') || 'https://phc.events';
    // this.fetchURL = this.getAttribute('fetchURL') || 'http://localhost:3000';
    this.draw();
  }

  draw = () => {
    this.innerHTML = `
      <div class="container">
        <h2>Update Insurance Form</h2>
        <form id="update-insurrance-form">
          
          <label for="exp-date">Expiration Date:</label>
          <input type="date" id="exp-date" name="exp-date" required>

          <label for="insurrance-file">Picure of Front of Insurance:</label>
          <input type="file" id="fileInput1" required>
          <label for="insurrance-file">Picture of Back of Insurance if applicable:</label>
          <input type="file" id="fileInput2">

          <input type="submit" value="Submit">

          <p id="form-message"></p>
        </form>
      </div>
    `;

    const updateInsurranceFormDOM = document.getElementById('update-insurrance-form');
    updateInsurranceFormDOM.addEventListener('submit', this.handleSubmit)
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
    const exoDateInputDOM = document.getElementById('exp-date');
    
    this.fileInput1 = document.getElementById('fileInput1');
    this.fileInput2 = document.getElementById('fileInput2');

    
    try {
      // get record info from guid
      // --------------------------------------------------------------------------------------------------
      const { Expiration_ID } = await axios({
        method: 'get', //put means update
        url: `${requestURL}/api/widgets/expirations`, //get from swagger
        params: {
          guid: this.guid
        },
      })
        .then(response => response.data)
        
      // update record in MP
      // --------------------------------------------------------------------------------------------------
      const newInsurrance = {
        'Expiration_ID': Expiration_ID,
        'Personal_Insurance_Expiration': new Date(exoDateInputDOM.value).toISOString(),
      }

      await axios({
        method: 'put', //put means update
        url: `${requestURL}/api/widgets/expirations`, //get from swagger
        data: newInsurrance,
      })
        .then(response => response.data)
  
      // upload insurrance files to mp
      // --------------------------------------------------------------------------------------------------
      // Create two FileReader instances
      let reader1 = new FileReader();
      let reader2 = new FileReader();
      let numOfFiles = 0;
    
      // Define a function to be called when both files have been read
      let filesRead = 0;
      function fileRead(uploadFunc) {
          filesRead++;
          if (filesRead === numOfFiles) {
              // Both files have been read - upload them
              uploadFunc(Expiration_ID);
          }
      }
    
      
      // Start reading the files
      if (this.fileInput1.files.length > 0) {
        reader1.readAsText(this.fileInput1.files[0]);
        numOfFiles ++;
      }
      if (this.fileInput2.files.length > 0) {
        reader2.readAsText(this.fileInput2.files[0]);
        numOfFiles ++;
      }
      // Define the onload function for both readers
      reader1.onload = () => fileRead(this.uploadFiles);
      reader2.onload = () => fileRead(this.uploadFiles);

      draw();
      showMessage('Record Updated Successfully. You can now close this page!')
    } catch (err) {
      console.error(err);
      showError('Something went wrong. Please try again or contact IT');
    }
  }

  uploadFiles = async (Expiration_ID) => {
    // Create the FormData instance
    const formData = new FormData();

    const todayString = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`;
    const files = [];
    if (this.fileInput1.files.length) files.push(new File([this.fileInput1.files[0]], `(Insurrance Front - ${todayString}) ${this.fileInput1.files[0].name}`, {type: this.fileInput1.files[0].type}));
    if (this.fileInput2.files.length) files.push(new File([this.fileInput2.files[0]], `(Insurrance Back - ${todayString}) ${this.fileInput2.files[0].name}`, {type: this.fileInput2.files[0].type}));

    // Append the two files
    files.forEach((file, i) => {
      formData.append(`files${i+1}`, file)
    })

    // Make the axios request
    await axios({
        method: 'post',
        url: `${this.fetchURL}/api/widgets/files/expirations?id=${Expiration_ID}`, //get from swagger
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(response => response.data)
  }
}

customElements.define('phc-car-insurrance-renewal', CarInsurranceRenewal);