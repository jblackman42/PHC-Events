class CustomForms extends HTMLElement {
  constructor() {
    super();

    this.formGUID = this.getAttribute('formid');
    this.requestURL = 'http://localhost:3000'

    if (!this.formGUID) return console.error('form guid not provided');

    this.getFormData();
  }

  getFormData = async () => {
    this.form = await axios({
      method: 'get',
      url: `${this.requestURL}/api/widgets/form?Form_ID=${this.formGUID}`
    })
      .then(response => response.data)

    this.fields = await axios({
      method: 'get',
      url: `${this.requestURL}/api/widgets/form-fields?Form_ID=${this.formGUID}`
    })
      .then(response => response.data)

    this.update();
  }

  update = () => {
    console.log(this.form)
    console.log(this.fields)
  }
}

customElements.define('phc-custom-form', CustomForms);