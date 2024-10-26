### Cosas q hacer para configurar el react native test library ###

1. Agregar en package.json todas las libraries que sean relacionadas a jest y dependencias de la libreria. Si se tiene un instalador de paquetes, ej.npm correr el comando

```  npm install --save-dev jest @testing-library/react-native @testing-library/jest-native```

2. Indicarle a jest todas las librerías que se están utilizando para q pueda parsearlo. jest.setup.js
![Alt text](images/jestSetUp.png)

Otra alternativa es agregar en el package.json:
```
  "jest": {
    "preset": "react-native",
    "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"]
  },
```
Si se quiere especificar el archivo de configuración de jest:
```     jest --config nombreArchivo ```

3. Utilizar un modulo q permita traducir librerías de react native, las cuales jest no reconoce.  babel.config.js
```npm install --save-dev @babel/plugin-transform-private-methods babel-preset-expo```
![Alt text](images/babelConfig.png)

4. Agregar en la lista de scripts de package.json la opcion de test:
```
{
  "scripts": {
    "test": "jest"
  }
}
```

5. Write your tests:
Crear archivos con estilo ComponentName.test.js:
![Alt text](images/BalanceCardTest.png)

**TODO:** 
Cambiar esta parte.
Use @testing-library/react-native's query methods like getByText, getByTestId, queryByText, etc., to find elements in your rendered component.
Use fireEvent to simulate user interactions like pressing buttons or typing text.
If you're using React Navigation, you might need to mock it in your tests. You can do this by creating a __mocks__ folder in your project root and adding mock files for the navigation modules.
Para este test a funcionar, se debe agregar testID props a los componentes.

Cuando es la primera vez, tardan los tests al tener que subir los modulos. Pero una vez subidos, el tiempo se reduce significativamente.

6. Eliminar cache de jest:
```npx jest --clearCache```

7. Correr los tests:
```npm test``` 

Otra manera es:
```npx jest --verbose```  
permite ver mejor los errores. 

8. Si todavia faltan dependencias:
```npm install```
