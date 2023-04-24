const facilitiesEquipmentContainer = document.getElementById('facilities-equipment-container');
const equipmentItemsContainer = document.querySelector('.equipment-items-container');
let equipment = [];
let selectedEquipment = [];

const facilitiesPopupShow = () => {
    facilitiesEquipmentContainer.classList.add('open')
}
const facilitiesPopupHide = () => {
    facilitiesEquipmentContainer.classList.remove('open')
}

const loadEquipment = async () => {
    equipment = await axios({
        method: 'get',
        url: '/api/mp/equipment'
    })
        .then(response => response.data)

    const equipmentItemsHTML = equipment.map(equipmentItem => {
        const {Equipment_Name, Quantity, Equipment_ID} = equipmentItem;
        return `
            <div class="equipment-item">
                <label for="${Equipment_ID}-checkbox">${Equipment_Name}</label>
                <input type="number" id="input-${Equipment_ID}" class="equipment-value-input" value="0" min="0" max="${Quantity}">
            </div>
        `
    }).join('');
    equipmentItemsContainer.innerHTML = equipmentItemsHTML;
}
loadEquipment();

const equipmentHandleSave = () => {
    const equipmentLabelDOM = document.getElementById('equipment-label');
    const numOfEquipments = [...document.querySelectorAll('.equipment-value-input')].filter(elem => elem.value > 0).length;

    equipmentLabelDOM.innerText = `${numOfEquipments} Equipment${numOfEquipments <= 1 ? '' : 's'}`;
    selectedEquipment.length = 0;
    equipment.forEach(equipmentItem => {
        const {Equipment_ID, Equipment_Name, Quantity} = equipmentItem;

        const equipmentInput = document.getElementById(`input-${Equipment_ID}`);
        const equipmentInputValue = parseInt(equipmentInput.value)

        const equipmentQuantity = equipmentInputValue > Quantity ? Quantity : equipmentInputValue;

        if (equipmentQuantity > 0) {
            selectedEquipment.push({
                Equipment_Name: Equipment_Name,
                Equipment_ID: Equipment_ID,
                Quantity: equipmentQuantity
            })
        }
    })

    facilitiesPopupHide();
}

const facilitiesPopupCancel = () => {
    const equipmentLabelDOM = document.getElementById('equipment-label');
    equipmentLabelDOM.innerText = '0 Equipment';
    
    for (const elem of document.querySelectorAll('.equipment-value-input')) {
        elem.value = 0;
    }

    facilitiesPopupHide();
}