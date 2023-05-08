class CustomForms extends HTMLElement {
  constructor() {
    super();

    this.formGUID = this.getAttribute('formguid');
    this.requestURL = 'http://localhost:3000'

    if (!this.formGUID) return console.error('form guid not provided');

    this.getFormData();
  }

  getFormData = async () => {
    this.form = await axios({
      method: 'get',
      url: `${this.requestURL}/api/widgets/form?Form_GUID=${this.formGUID}`
    })
      .then(response => response.data)

    this.fields = await axios({
      method: 'get',
      url: `${this.requestURL}/api/widgets/form-fields?Form_ID=${this.form.Form_ID}`
    })
      .then(response => response.data)

    console.log(this.form)
    console.log(this.fields)

    this.update();
  }

  update = () => {
    const { Form_Title, Instructions } = this.form;

    this.innerHTML = `
      <div id='form-title-container'>
        <h1>${Form_Title}</h1>
      </div>
      <div id='form-instruction-container'>${Instructions}</div>
      <form id="phc-custom-form">
        ${this.fields.map(field => {
          const { Field_Label, Alternate_Label, Form_Field_ID, Field_Type_ID, Field_Values, Is_Hidden} = field;
          if (Is_Hidden) return;
          // 1 - text box
          // 2 - text area
          // 3 - date
          // 4 - radio vertical
          // 5 - select
          // 6 - instructions
          // 7 - radio horizontal
          // 8 - checkbox
          // 9 - file upload
          return Field_Type_ID == 1 ? `
            <div class="input-container">
              <label for="${Form_Field_ID}">${Alternate_Label || Field_Label}</label>
              <input type="text" id="${Form_Field_ID}"></input>
            </div>
          ` : Field_Type_ID == 2 ? `
            <div class="input-container">
              <label for="${Form_Field_ID}">${Field_Label}</label>
              <textarea id="${Form_Field_ID}"></textarea>
            </div>
          ` : Field_Type_ID == 3 ? `
            <div class="input-container">
              <label for="${Form_Field_ID}">${Field_Label}</label>
              <input type="date" id="${Form_Field_ID}"></input>
            </div>
          ` : Field_Type_ID == 4 ? `
            <div class="input-container" id="${Form_Field_ID}">
              <label for="${Form_Field_ID}">${Field_Label}</label>
              <div class="radio vertical">
                ${Field_Values.split('\n').map(value => {
                  return `
                    <div class="input">
                      <input type="radio" name="${Form_Field_ID}" id="${Form_Field_ID}-${value}" value="${value}"></input>
                      <label for="${Form_Field_ID}-${value}">${value}</label>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          ` : Field_Type_ID == 5 ? `
            <div class="input-container">
              <label for="${Form_Field_ID}">${Field_Label}</label>
              <select id="${Form_Field_ID}">
                ${Field_Values.split('\n').map(value => {
                  return `
                    <option value="${value}">${value}</option>
                  `
                }).join('')}
              </select>
            </div>
          ` : Field_Type_ID == 6 ? `
            <div class="input-container instructions" id="${Form_Field_ID}">
              <p>${Alternate_Label || Field_Label}</p>
            </div>
          ` : Field_Type_ID == 7 ? `
            <div class="input-container" id="${Form_Field_ID}">
              <label for="${Form_Field_ID}">${Field_Label}</label>
              <div class="radio horizontal">
                ${Field_Values.split('\n').map(value => {
                  return `
                    <div class="input">
                      <input type="radio" name="${Form_Field_ID}" id="${Form_Field_ID}-${value}" value="${value}"></input>
                      <label for="${Form_Field_ID}-${value}">${value}</label>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          ` : Field_Type_ID == 8 ? `
            <div class="input-container">
              <label for="${Form_Field_ID}">${Field_Label}</label>
              <div class="checkbox">
                <input type="checkbox" id="${Form_Field_ID}" value="${Form_Field_ID}"></input>
                <label for="${Form_Field_ID}">${Alternate_Label || Field_Label}</label>
              </div>
            </div>
          ` : Field_Type_ID == 9 ? `
            <h1 style="color: red;">DO NOT USE FILE INPUT</h1>
          ` : ''
        }).join('')}
      
        <button type='submit'>submit</button>
      </form>
    
    `

    const phcCustomFormDOM = document.getElementById('phc-custom-form');
    phcCustomFormDOM.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const parameters = [];
      for (const elem of e.target) {
        if (elem.tagName != 'INPUT' && elem.tagName != 'TEXTAREA' && elem.tagName != 'SELECT') continue;

        if (elem.type == 'radio') {
          if (elem.checked) {
            parameters.push({
              name: elem.name,
              value: elem.value
            })
          }
          continue;
        }

        if (elem.type == 'checkbox') {
          parameters.push({
            name: elem.id,
            value: elem.checked ? 1 : 0
          })

          continue;
        }

        parameters.push({
          name: elem.id,
          value: elem.value
        })
      }

      // console.log(this.fields)
      console.log(parameters)
      
      const formResponseData = await axios({
        method: 'post',
        url: `${this.requestURL}/api/widgets/form-submit`,
        data: {
          params: parameters,
          procedure: this.form.Procedure_Name,
          group_id: this.form.Add_to_Group
        }
      })
        .then(response => response.data)
        .catch(err => console.error(err))

      console.log(formResponseData)
    })
  }
}

customElements.define('phc-custom-form', CustomForms);