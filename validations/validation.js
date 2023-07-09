const Crafter = require('../models/Crafter');
const Consumer = require('../models/Consumer');
module.exports = {
    uniqueCheckMobileCrafter: async (value) => {
        const user = await Crafter.findOne({raw: true, where: { mobileNo: value }});
        if (user) {
            throw new Error("Mobile No already exists");
        }
    },
    uniqueCheckMobileConsumer: async (value) => {
        const user = await Consumer.findOne({raw: true, where: { mobileNo: value }});
        if (user) {
            throw new Error("Mobile No already exists");
        }
    }

}