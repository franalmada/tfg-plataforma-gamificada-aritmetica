import fetch from 'node-fetch';

const testRegister = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Juan Pérez',
                email: 'juan@example.com',
                password: '123456',
                role: 'docente',
            }),
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);
    } catch (error) {
        console.error('Error en la petición:', error);
    }
};

testRegister();
