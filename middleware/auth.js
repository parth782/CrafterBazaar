const jwt = require("jsonwebtoken");
module.exports = {
    ensureCrafterAuthenticated: (req, res, next) => {
        const token = req.header('authtoken');
        if (!token) {
            return res.status(401).send({ error: "Please Authenticate using valid token1" });
        }
        try {
            const data = jwt.verify(token, process.env.JWT_SECRET);
            if (data.role != "crafter") {
                return res.status(401).send({ error: "Please Authenticate using valid token" });
            }
            req.user = data;
            next();
        } catch (err) {
            console.log(err);
            return res.status(401).send({ error: "Please Authenticate using valid token" });
        }
    },
    ensureConsumerAuthenticated: (req, res, next) => {
        const token = req.header('authtoken');
        if (!token) {
            return res.status(401).send({ error: "Please Authenticate using valid token" });
        }
        try {
            const data = jwt.verify(token, process.env.JWT_SECRET);
            if (data.role != "consumer") {
                return res.status(401).send({ error: "Please Authenticate using valid token" });
            }
            req.user = data;
            next();
        } catch (err) {
            console.log(err);
            return res.status(401).send({ error: "Please Authenticate using valid token" });
        }
    },
    ensureAdminAuthenticated: (req, res, next) => {
        const token = req.header('authtoken');
        if (!token) {
            return res.status(401).send({ error: "Please Authenticate using valid token" });
        }
        try {
            const data = jwt.verify(token, process.env.JWT_SECRET);
            if (data.role != "admin") {
                return res.status(401).send({ error: "Please Authenticate using valid token" });
            }
            req.user = data;
            next();
        } catch (err) {
            console.log(err);
            return res.status(500).send({ error: "Some Error Occured" });
        }
    }
}