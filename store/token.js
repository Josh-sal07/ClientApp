// session.js
let token = null;

export const setToken = (id) => {
    token = id;
};

export const getToken = () => token;