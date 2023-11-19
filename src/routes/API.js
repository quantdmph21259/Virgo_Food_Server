import express from 'express'
import api from '../controllers/API'

const route = express.Router()

const initAPIRoute = (app) => {
    route.get('/user/users', api.getAllUser)
    route.get('/user/products', api.getHomeProduct)
    route.get('/user/rices', api.getAllRice)
    route.get('/user/search_user_by_id/:id', api.findUserById)
    route.get('/user/categories', api.getAllCatgoryChild)
    route.get('/user/filter_product_by_category/:id', api.filterFoodByCategoryChild)
    route.get('/user/carts/:idUser', api.getAllCartByUser)
    route.get('/user/carts/quantity/:idUser', api.getQuantityCarts)
    route.get('/user/bills/quantity/:idUser', api.getQuantityBills)
    route.get('/user/bills/waiting/:id', api.getBillsWaiting)
    route.get('/user/bills/shipping/:id', api.getBillsShipping)
    route.get('/user/bills/done/:id', api.getBillsDone)
    route.get('/user/bills/search_by_id/:id', api.searchOrderById)
    route.get('/user/order/history/:id', api.getHistoryOrder)

    route.post('/user/sign_up', api.handleSignUpUser)
    route.post('/user/login', api.handleLoginUser)
    route.post('/user/search_product_by_name', api.handleSearchFoodByName)
    route.post('/user/update_phone_number', api.handleUpdatePhoneNumber)
    route.post('/user/update_email', api.handleUpdateEmail)
    route.post('/user/update_password', api.handleUpdatePassword)
    route.post('/user/update_information', api.handleUpdateUserInfo)
    route.post('/user/filter_food_by_name_and_category/:idCategory', api.searchProductByNameAndCategory)
    route.post('/user/add_product_to_cart', api.addProductToCart)
    route.post('/user/cart/check_out/:idUser', api.handleCheckOutCart)

    route.put('/user/increase_cart/:id', api.increaseCart)
    route.put('/user/reduce_cart/:id', api.reduceCart)
    route.put('/user/profile/address/update', api.updateAddress)
    route.put('/user/bills/confirm_order/:id', api.confirmShippingDone)
    route.put('/user/bills/cancel_order/:id', api.cancelOrder)
    route.put('/user/profile/update_avatar', api.updateAvatarUser)

    route.delete('/user/cart/delete/:id', api.deleteCart)

    return app.use('/api/v1', route)
}

export default initAPIRoute