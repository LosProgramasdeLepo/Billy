// import React from 'react'
// import { View } from 'react-native'
// import AddButton from '../../components/addButton'

// describe('AddButton Component', () => {
//   it('renders the add button', () => {
//     cy.mount(
//       <View>
//         <AddButton />
//       </View>
//     )
    
//     // Check if the button is rendered
//     cy.get('button').should('exist')
//   })

//   it('opens the modal when clicked', () => {
//     cy.mount(
//       <View>
//         <AddButton />
//       </View>
//     )
    
//     // Click the button
//     cy.get('button').click()

//     // Check if the modal is visible
//     cy.get('Modal').should('exist')
//   })

//   it('closes the modal when close function is called', () => {
//     cy.mount(
//       <View>
//         <AddButton />
//       </View>
//     )
    
//     // Click the button to open the modal
//     cy.get('button').click()

//     // Check if the modal is visible
//     cy.get('Modal').should('exist')

//     // Find and click the close button in the modal
//     cy.get('Modal').find('button').contains('Close').click()

//     // Check if the modal is no longer visible
//     cy.get('Modal').should('not.exist')
//   })
// })
