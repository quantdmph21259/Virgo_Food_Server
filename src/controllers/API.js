import { pool } from '../configs/index'
import { v4 as uuidv4 } from 'uuid'
import getTimeNow from '../functions/getTimeNow'
import Status from '../functions/Status'

const getAllUser = async (req, res) => {
    const [rows, fields] = await pool.execute(
        `select * from users where role = 0`
    )

    return res.status(200).json(rows)
}

const getHomeProduct = async (req, res) => {
    const [rows, fields] = await pool.execute(
        `
        SELECT 
        foods.id, foods.name, description,
        price, image, status, discount
        , categories_child.name as category
        FROM foods
        JOIN categories_child on foods.category_id = categories_child.id
        where categories_child.name in ('Cơm', 'Trà sữa', 'Bánh mì', 'Bánh tráng', 'Mì')
        and status = 1
        limit 30
        `
    )

    return res.status(200).json(rows.sort(() => Math.random() - 0.5))
}

const getAllRice = async (req, res) => {
    const [rows, fields] = await pool.execute(
        `
        SELECT 
        foods.id, foods.name, description,
        price, image, status, discount
        , categories_child.name as category
        FROM foods
        JOIN categories_child on foods.category_id = categories_child.id
        where categories_child.name in ('Cơm')
        and status = 1
        `
    )

    return res.status(200).json(rows.sort(() => Math.random() - 0.5))
}

const handleSignUpUser = async (req, res) => {
    const { userName, email, password, phoneNumber } = req.body
    const id = uuidv4()
    const imageDefault = 'https://firebasestorage.googleapis.com/v0/b/food-app-24bf2.appspot.com/o/avatar_user%2Favatar_default.JPEG?alt=media&token=780593e5-add2-4334-b6c0-f1b024dbecb0'
    const role = 0
    const createdAt = getTimeNow()
    const updatedAt = createdAt

    // check input
    console.log(
        `
        \n>>>>> Check input sign up user: 
        User name: ${userName}
        Email: ${email}
        Password: ${password}
        PhoneNumber: ${phoneNumber}
        ID: ${id}
        ImageDefault: ${imageDefault}
        Role: ${role == 0 ? 'User' : 'Admin'}
        Created at: ${createdAt}
        Updated at: ${updatedAt}
        \n
        `
    )

    // Kiểm tra email đã tồn tại trong csdl chưa
    const [emailFound] = await pool.execute(
        `select email from users where email = ?`, [email]
    )

    // Kiểm tra số điện thoại tồn tại trong csdl chưa
    const [phoneNumberFound] = await pool.execute(
        `select phoneNumber from users where phoneNumber = ?`, [phoneNumber]
    )

    // validate
    if (emailFound[0]) {
        console.log(
            `
                \n>>>>> Check user found by email: ${JSON.stringify(emailFound[0])}\n
            `
        )
        return res.status(400).json({
            message: 'Email này đã được đăng kí!'
        })
    } if (phoneNumberFound[0]) {
        console.log(
            `
                \n>>>>> Check phone number found: ${JSON.stringify(phoneNumberFound[0])}\n
            `
        )
        return res.status(401).json({
            message: 'Số điện thoại này đã được đăng kí!'
        })
    }

    // handle add to db
    await pool.execute(
        `insert into users (id, userName, email, password, image, role, phoneNumber, created_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userName, email, password, imageDefault, role, phoneNumber, createdAt, updatedAt]
    )

    console.log(
        `\n>>>>>> Inser new user successful!\n`
    )

    return res.status(200).json({
        message: 'Oke'
    })
}

const handleLoginUser = async (req, res) => {
    const { email, password } = req.body

    const [userFound] = await pool.execute(
        `select * from users where email = ? and role = 0`, [email]
    )

    console.log(
        `
        \n>>>>> Check user found: ${JSON.stringify(userFound[0])}
        `
    )

    if (!userFound[0]) {
        return res.status(404).json({
            message: 'Không tìm thấy email!',
            status: 404,
        })
    } if (userFound[0].password !== password) {
        return res.status(405).json({
            message: 'Mật khẩu không đúng!',
            status: 405
        })
    }

    return res.status(200).json({
        objectCurrent: userFound[0],
    })
}

const handleSearchFoodByName = async (req, res) => {
    const { keyName } = req.body

    const sqlQuery = `SELECT 
    foods.id, foods.name, description,
    price, image, status, discount,
    categories_child.name AS category
    FROM foods
    JOIN categories_child ON foods.category_id = categories_child.id 
    WHERE MATCH(foods.name) AGAINST ('${keyName}')`
    const [results] = await pool.execute(
        sqlQuery
    )

    // => results is arr

    return res.status(200).json({
        results: results
    })
}

const handleUpdatePhoneNumber = async (req, res) => {
    const { phoneNumber, idUser } = req.body

    console.log(
        `
        \n>>>>> Check Update Phone Number
        Phone number: ${phoneNumber}
        ID User: ${idUser}\n
        `
    )

    // find phoneNumber in db
    const [phoneNumberFound] = await pool.execute(
        `select phoneNumber from users where phoneNumber = ?`, [phoneNumber]
    )

    console.log(
        `
        \n>>>>> Check phone number found: ${phoneNumberFound[0]}\n
        `
    )

    if (phoneNumberFound[0]) {
        return res.status(405).json({
            flag: 405,
            message: 'Số điện thoại đã được đăng kí trước đó!'
        })
    }

    // handle update phone number
    await pool.execute(
        `update users
        set phoneNumber = ?
        where id = ?`, [phoneNumber, idUser]
    )

    return res.status(200).json({
        flag: 200,
        message: 'Cập nhật số điện thoại thành công!'
    })
}

const findUserById = async (req, res) => {
    const idUser = req.params.id

    const [user] = await pool.execute(
        'select * from users where id = ?', [idUser]
    )

    console.log(
        `
        \n>>>>> Check user found by id: ${JSON.stringify(user[0])}\n
        `
    )

    return res.status(200).json(user[0])
}

const handleUpdateEmail = async (req, res) => {
    const { email, idUser } = req.body

    console.log(
        `
        \n>>>>> Check Email Update
        Email: ${email}
        ID User: ${idUser}\n
        `
    )

    // find email
    const [emailFound] = await pool.execute(
        `select email from users where email = ?`, [email]
    )

    if (emailFound[0]) {
        return res.status(405).json({
            flag: 405,
            message: 'Email đã được đăng kí trước đó!'
        })
    }

    // handle update email
    await pool.execute(
        `
        update users
        set email = ?
        where id = ?
        `, [email, idUser]
    )

    return res.status(200).json({
        flag: 200,
        message: 'Cập nhật email thành công!'
    })
}

const handleUpdatePassword = async (req, res) => {
    const { password, idUser } = req.body

    await pool.execute(
        `update users
        set password = ?
        where id = ?`, [password, idUser]
    )

    return res.status(200).json({
        flag: 200,
        message: 'Update password user successful!'
    })
}

const handleUpdateUserInfo = async (req, res) => {
    const { fieldUpdateValue, updated_at, idUser, flag } = req.body
    let message = ''

    switch (flag) {
        case 0: {
            // handle update
            await pool.execute(
                `update users
                set userName = ?, updated_at = ?
                where id = ?`, [fieldUpdateValue, updated_at, idUser]
            )

            message = 'Cập nhật tên đăng nhập thành công!'
            break
        }
        case 1: {
            await pool.execute(
                `update users
                set bio = ?, updated_at = ?
                where id = ?`, [fieldUpdateValue, updated_at, idUser]
            )

            message = 'Cập nhật bio thành công!'
            break
        }
        case 2: {
            await pool.execute(
                `update users 
                set gender = ?, updated_at = ?
                where id = ?`, [fieldUpdateValue, updated_at, idUser]
            )

            message = 'Cập nhật giới tính thành công!'
            break
        }
        case 3: {
            await pool.execute(
                `
                update users
                set dob = ?, updated_at = ?
                where id = ?
                `, [fieldUpdateValue, updated_at, idUser]
            )

            message = 'Cập nhật ngày sinh người dùng thành công!'
            break
        }
        default: {
            break
        }
    }

    return res.status(200).json({
        flag: 200,
        message: message
    })
}

const getAllCatgoryChild = async (req, res) => {
    const [rows, fields] = await pool.execute(
        `
        select * from categories_child
        order by name asc
        `
    )

    return res.status(200).json(rows)
}

const filterFoodByCategoryChild = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check ID Category Child:
        ID: ${id}\n
        `
    )

    const [rows, fields] = await pool.execute(
        `
        SELECT 
        foods.id, foods.name, description,
        price, image, status, discount
        , categories_child.name as category
        FROM foods
        JOIN categories_child on foods.category_id = categories_child.id
        where categories_child.id = ?
        and status = 1
        `, [id]
    )

    return res.status(200).json(rows)
}

const searchProductByNameAndCategory = async (req, res) => {
    const idCategory = String(req.params.idCategory).trim()
    let { keySearch } = req.body
    keySearch = String(keySearch).trim()

    console.log(
        `
        \n>>>>> Check Search Product By Name And Category
        ID Category: ${idCategory}
        Key Search: ${keySearch}\n
        `
    )

    const sqlQuery = `SELECT 
    foods.id, foods.name, description,
    price, image, status, discount,
    categories_child.name AS category
    FROM foods
    JOIN categories_child ON foods.category_id = categories_child.id 
    WHERE MATCH(foods.name) AGAINST ('${keySearch}')
    AND foods.category_id = '${idCategory}'`

    const [results] = await pool.execute(
        sqlQuery
    )

    console.log(

    )

    return res.status(200).json(results)
}

const addProductToCart = async (req, res) => {
    let { idProduct, idUser } = req.body
    idProduct = String(idProduct).trim()
    idUser = String(idUser).trim()
    const id = uuidv4()
    const quantity = 1
    const status = 0

    const [rows, fields] = await pool.execute(
        `
        select * from carts
        where id_product = ?
        and id_user = ? and carts.status = 0
        `, [idProduct, idUser]
    )

    console.log(
        `
        \n>>>>> Check Cart Found By ID Product And ID User
        Cart: ${JSON.stringify(rows[0])}\n
        `
    )

    if (rows[0] != undefined || rows[0] != null) { // tìm thấy
        await pool.execute(
            `
            update carts
            set quantity = quantity + 1
            where id = ?
            `, [rows[0].id]
        )
    } else { // không tìm thấy
        await pool.execute(
            `
            insert into carts (id, id_product, id_user, quantity, status)
            values (?, ?, ?, ?, ?)
            `, [id, idProduct, idUser, quantity, status]
        )
    }

    return res.status(200).json({
        flag: 1
    })
}

const getAllCartByUser = async (req, res) => {
    const idUser = String(req.params.idUser).trim()

    console.log(
        `
        \n>>>>> Check Get Cart By ID User
        ID: ${idUser}\n
        `
    )

    const [rows, fields] = await pool.execute(
        `
        select carts.id as id, carts.quantity as quantity, foods.name as name, foods.price as price, foods.discount as discount,
        foods.image as image, foods.id as idFood from carts
        inner join foods on carts.id_product = foods.id
        where carts.id_user = ? and carts.status = 0
        `, [idUser]
    )

    return res.status(200).json(rows)
}

const increaseCart = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check ID Cart Increase
        ID: ${id}\n
        `
    )

    await pool.execute(
        `
        update carts 
        set quantity = quantity + 1
        where id = ?
        `, [id]
    )

    return res.status(200).json({
        flag: 1
    })
}

const reduceCart = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check ID Cart Increase
        ID: ${id}\n
        `
    )

    await pool.execute(
        `
        update carts 
        set quantity = quantity - 1
        where id = ?
        `, [id]
    )

    return res.status(200).json({
        flag: 1
    })
}

const deleteCart = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check ID Cart Delete
        ID: ${id}\n
        `
    )

    await pool.execute(
        `
        delete from carts
        where id = ?
        `, [id]
    )

    return res.status(200).json({
        flag: 1
    })
}

const handleCheckOutCart = async (req, res) => {
    const idUser = String(req.params.idUser).trim()
    let { price } = req.body
    const createdAt = getTimeNow()
    const status_shipping = Status.waitting
    const status_payment = Status.cod
    const idBills = uuidv4()

    console.log(
        `
        \n>>>>> Check Handle Check Out Cart
        ID User: ${idUser}\n
        `
    )

    // thêm mới hóa đơn
    await pool.execute(
        `
        insert into bills (id, id_user, price, created_at, status_shipping, status_payment)
        values(?, ?, ?, ?, ?, ?)
        `, [idBills, idUser, price, createdAt, status_shipping, status_payment]
    )

    // cập nhật lại giỏ hàng
    await pool.execute(
        `
        update carts
        set id_order = ?, status = 1
        where carts.id_user = ? and status = 0
        `, [idBills, idUser]
    )

    return res.status(200).json({
        flag: 1
    })
}

const updateAddress = async (req, res) => {
    let { idUser, address } = req.body
    idUser = String(idUser).trim()
    address = String(address).trim()

    console.log(
        `
        \n>>>>> Check Update Address
        ID User: ${idUser}
        Address: ${address}\n
        `
    )

    await pool.execute(
        `
        update users
        set address =?
        where id = ?
        `, [address, idUser]
    )

    return res.status(200).json({
        flag: 1
    })
}

const getQuantityCarts = async (req, res) => {
    const idUser = String(req.params.idUser).trim()

    console.log(
        `
        \n>>>>> Check Get Quantity Carts
        ID User: ${idUser}\n
        `
    )

    const quantity = await pool.execute(
        `
        SELECT COUNT(*) AS total_records
        FROM carts
        WHERE id_user = ? and carts.status = 0
        `, [idUser]
    )

    console.log(
        `
        \n>>>>> Check Quantity
        Quantity: ${JSON.stringify(quantity[0][0].total_records)}\n
        `
    )

    return res.status(200).json({
        flag: 1,
        total_records: quantity[0][0].total_records
    })
}

const getQuantityBills = async (req, res) => {
    const idUser = String(req.params.idUser).trim()

    console.log(
        `
        \n>>>>> Check Get Quantity Bill
        ID User: ${idUser}\n
        `
    )

    const [rows, fiedls] = await pool.execute(
        `
        select count(*) as total_records
        from bills
        where id_user = ? and status_shipping = 2
        `, [idUser]
    )

    console.log(
        `
        \n>>>>> Check Quantity Bill
        Quantity: ${JSON.stringify(rows[0].total_records)}\n
        `
    )

    return res.status(200).json({
        flag: 1,
        total_records: rows[0].total_records
    })
}

const getBillsWaiting = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check Get Bill Waiting:
        ID: ${id}\n
        `
    )

    const [rows, fields] = await pool.execute(
        `
        SELECT bills.*, CAST(SUM(carts.quantity) AS UNSIGNED) AS product_count
        FROM bills
        JOIN carts ON bills.id = carts.id_order
        WHERE bills.status_shipping = 0 and bills.id_user = ?
        GROUP BY bills.id 
        ORDER BY STR_TO_DATE(bills.created_at, '%d/%m/%Y %H:%i:%s') DESC
        `, [id]
    )

    return res.status(200).json({
        data: rows
    })
}

const getBillsShipping = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check Get Bill Waiting:
        ID: ${id}\n
        `
    )

    const [rows, fields] = await pool.execute(
        `
        SELECT bills.*, CAST(SUM(carts.quantity) AS UNSIGNED) AS product_count
        FROM bills
        JOIN carts ON bills.id = carts.id_order
        WHERE bills.status_shipping = 1 and bills.id_user = ?
        GROUP BY bills.id 
        ORDER BY STR_TO_DATE(bills.created_at, '%d/%m/%Y %H:%i:%s') DESC
        `, [id]
    )

    return res.status(200).json({
        data: rows
    })
}

const getBillsDone = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check Get Bill Waiting:
        ID: ${id}\n
        `
    )

    const [rows, fields] = await pool.execute(
        `
        SELECT bills.*, CAST(SUM(carts.quantity) AS UNSIGNED) AS product_count
        FROM bills
        JOIN carts ON bills.id = carts.id_order
        WHERE bills.status_shipping = 2 and bills.id_user = ?
        GROUP BY bills.id 
        ORDER BY STR_TO_DATE(bills.created_at, '%d/%m/%Y %H:%i:%s') DESC
        `, [id]
    )

    return res.status(200).json({
        data: rows
    })
}

const confirmShippingDone = async (req, res) => {
    const id = String(req.params.id).trim()

    await pool.execute(
        `
        update bills
        set status_shipping = 2
        where id = ?
        `, [id]
    )

    return res.status(200).json({
        flag: 1
    })
}

const searchOrderById = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check Search Order By ID
        ID: ${id}\n
        `
    )

    const [rows, fields] = await pool.execute(
        `
        select bills.created_at as created_at,
        bills.id as id,
        users.userName as user_name,
        users.email as email,
        users.phoneNumber as phone_number,
        users.address as address,
        carts.quantity as quantity,
        foods.name as food_name,
        foods.image as food_image,
        foods.price as price,
        foods.discount as discount
        from bills
        inner join users on users.id = bills.id_user
        inner join carts on carts.id_order = bills.id
        inner join foods on carts.id_product = foods.id
        where bills.id = ?
        `, [id]
    )

    return res.status(200).json({
        data: rows
    })
}

const cancelOrder = async (req, res) => {
    const id = String(req.params.id).trim()

    console.log(
        `
        \n>>>>> Check Cancel Order
        ID: ${id}\n
        `
    )

    await pool.execute(
        `
        update carts
        set 
        id_order = null,
        status = 0
        where id_order = ?
        `, [id]
    )

    await pool.execute(
        `
        DELETE FROM bills WHERE id = ?
        `, [id]
    )

    return res.status(200).json({
        flag: 1
    })
}

const getHistoryOrder = async (req, res) => {
    const id = String(req.params.id).trim()

    const [rows, fields] = await pool.execute(
        `
        select distinct
        foods.name,
        foods.image
        from foods
        inner join carts on carts.id_product = foods.id
        inner join users on carts.id_user = users.id
        where users.id = ? and carts.status = 1
        ORDER BY foods.name ASC
        `, [id]
    )

    return res.status(200).json({
        data: rows
    })
}

const updateAvatarUser = async (req, res) => {
    let { image, id } = req.body
    image = String(image).trim()
    id = String(id).trim()

    console.log(
        `
        \n>>>>> Check Update Avatar User
        ID: ${id}
        Image: ${image}\n
        `
    )

    await pool.execute(
        `
        update users
        set image = ?
        where id = ?
        `, [image, id]
    )

    return res.status(200).json({
        flag: 1
    })
}

const API = {
    getAllUser,
    getHomeProduct,
    handleSignUpUser,
    handleLoginUser,
    handleSearchFoodByName,
    getAllRice,
    handleUpdatePhoneNumber,
    findUserById,
    handleUpdateEmail,
    handleUpdatePassword,
    handleUpdateUserInfo,
    getAllCatgoryChild,
    filterFoodByCategoryChild,
    searchProductByNameAndCategory,
    addProductToCart,
    getAllCartByUser,
    increaseCart,
    reduceCart,
    deleteCart,
    handleCheckOutCart,
    updateAddress,
    getQuantityCarts,
    getQuantityBills,
    getBillsWaiting,
    getBillsShipping,
    getBillsDone,
    confirmShippingDone,
    searchOrderById,
    cancelOrder,
    getHistoryOrder,
    updateAvatarUser
}

export default API