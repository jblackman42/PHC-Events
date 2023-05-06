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

    this.checkFields = await axios({
      method: 'get',
      url: `${this.requestURL}/api/widgets/validate-form-fields?procedure=${this.form.Procedure_Name}`
    })
      .then(response => response.data)

    const allFieldNames = this.fields.filter(field => field.Field_Type != 6).map(field => field.Field_Name);
    const checkFieldsNames = this.checkFields.map(field => field.Name);
    const fieldDifferences = [...allFieldNames, ...checkFieldsNames].filter(fieldName => !(allFieldNames.includes(fieldName) && checkFieldsNames.includes(fieldName)))

    if (fieldDifferences.length) {
      console.error('Stored procedure parameters do not match. Incorrect fields: ' + fieldDifferences.join(', '))
      return;
    } else {
      console.log('all fields match')
    }

    this.update();
  }

  update = () => {
    const { Form_Name, Instructions } = this.form;

    this.innerHTML = `
      <div id='form-title-container'>
        <h1>${Form_Name}</h1>
      </div>
      <div id='form-instruction-container'>${Instructions}</div>
      <form id="phc-custom-form">
        ${this.fields.map(field => {
          const { Field_Label, Field_Name, Field_Type, Placeholder, Field_Value } = field;
          // 1 - text box
          // 2 - text area
          // 3 - date
          // 4 - radio vertical
          // 5 - select
          // 6 - instructions
          // 7 - radio horizontal
          // 8 - checkbox
          // 9 - file upload
          return Field_Type == 1 ? `
            <div class="input-container">
              <label for="${Field_Name}">${Field_Label}</label>
              <input type="text" id="${Field_Name}" placeholder="${Placeholder || ''}"></input>
            </div>
          ` : Field_Type == 2 ? `
            <div class="input-container">
              <label for="${Field_Name}">${Field_Label}</label>
              <textarea id="${Field_Name}" placeholder="${Placeholder || ''}"></textarea>
            </div>
          ` : Field_Type == 3 ? `
            <div class="input-container">
              <label for="${Field_Name}">${Field_Label}</label>
              <input type="date" id="${Field_Name}"></input>
            </div>
          ` : Field_Type == 4 ? `
            <div class="input-container" id="${Field_Name}">
              <label for="${Field_Name}">${Field_Label}</label>
              <div class="radio vertical">
                ${Field_Value.split('\n').map(value => {
                  return `
                    <div class="input">
                      <input type="radio" name="${Field_Name}" id="${Field_Name}-${value}" value="${value}"></input>
                      <label for="${Field_Name}-${value}">${value}</label>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          ` : Field_Type == 5 ? `
            <div class="input-container">
              <label for="${Field_Name}">${Field_Label}</label>
              <select id="${Field_Name}">
                ${Field_Value.split('\n').map(value => {
                  return `
                    <option value="${value}">${value}</option>
                  `
                }).join('')}
              </select>
            </div>
          ` : Field_Type == 6 ? `
            <div class="input-container instructions" id="${Field_Name}">
              <p>${Field_Value}</p>
            </div>
          ` : Field_Type == 7 ? `
            <div class="input-container" id="${Field_Name}">
              <label for="${Field_Name}">${Field_Label}</label>
              <div class="radio horizontal">
                ${Field_Value.split('\n').map(value => {
                  return `
                    <div class="input">
                      <input type="radio" name="${Field_Name}" id="${Field_Name}-${value}" value="${value}"></input>
                      <label for="${Field_Name}-${value}">${value}</label>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          ` : Field_Type == 8 ? `
            <div class="input-container">
              <label for="${Field_Name}">${Field_Label}</label>
              <div class="checkbox">
                <input type="checkbox" id="${Field_Name}" value="${Field_Value}"></input>
                <label for="${Field_Name}">${Field_Value}</label>
              </div>
            </div>
          ` : Field_Type == 9 ? `
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