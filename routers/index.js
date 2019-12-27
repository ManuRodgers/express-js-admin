/*
用来定义路由的路由器模块
 */
const express = require("express");
const md5 = require("blueimp-md5");
const dayjs = require("dayjs");

const UserModel = require("../models/UserModel");
const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/ProductModel");
const RoleModel = require("../models/RoleModel");

// 得到路由器对象
const router = express.Router();
// console.log('router', router)

// 指定需要过滤的属性
const filter = { password: 0, __v: 0 };

// 登陆
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(`req.body`, req.body);
  console.log(`username`, username);
  console.log(`password`, password);
  // 根据username和password查询数据库users, 如果没有, 返回提示错误的信息, 如果有, 返回登陆成功信息(包含user)
  UserModel.findOne({ username, password: md5(password) })
    .then(user => {
      if (user) {
        // 登陆成功
        // 生成一个cookie(userid: user._id), 并交给浏览器保存
        res.cookie("userid", user._id, { maxAge: 1000 * 60 * 60 * 24 });
        if (user.role_id) {
          RoleModel.findOne({ _id: user.role_id }).then(role => {
            user._doc.role = role;
            console.log("role user", user);
            res.send({ status: 0, data: user });
          });
        } else {
          user._doc.role = { menus: [] };
          // 返回登陆成功信息(包含user)
          res.send({ status: 0, data: user });
        }
      } else {
        // 登陆失败
        res.send({ status: 1, msg: "incorrect username or password" });
      }
    })
    .catch(error => {
      console.error("login error", error);
      res.send({ status: 1, msg: "login error, please try again" });
    });
});

// 添加用户
router.post("/manage/user/add", (req, res) => {
  // 读取请求参数数据
  const { username, password } = req.body;
  // 处理: 判断用户是否已经存在, 如果存在, 返回提示错误的信息, 如果不存在, 保存
  // 查询(根据username)
  UserModel.findOne({ username })
    .then(user => {
      // 如果user有值(已存在)
      if (user) {
        // 返回提示错误的信息
        res.send({ status: 1, msg: "this username already exists" });
        return new Promise(() => {});
      } else {
        // 没值(不存在)
        // 保存
        return UserModel.create({
          ...req.body,
          create_time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          password: md5(password || "atguigu")
        });
      }
    })
    .then(user => {
      // 返回包含user的json数据
      res.send({ status: 0, data: user });
    })
    .catch(error => {
      console.error("register error", error);
      res.send({ status: 1, msg: "register error, please register again" });
    });
});

// 更新用户
router.put("/manage/user/update", (req, res) => {
  const user = req.body;
  console.log(`user`, user);
  UserModel.findOneAndUpdate({ _id: user._id }, user)
    .then(oldUser => {
      const data = Object.assign(oldUser, user);
      // 返回
      res.send({ status: 0, data });
    })
    .catch(error => {
      console.error("update user error", error);
      res.send({ status: 1, msg: "update user error, please try again" });
    });
});

// 删除用户
router.delete("/manage/user/delete", (req, res) => {
  const { userId } = req.body;
  console.log(`req.body`, req.body);
  UserModel.deleteOne({ _id: userId }).then(doc => {
    res.send({ status: 0 });
  });
});

// 获取用户信息的路由(根据cookie中的userid)
/*router.get('/user', (req, res) => {
  // 从请求的cookie得到userid
  const userid = req.cookies.userid
  // 如果不存在, 直接返回一个提示信息
  if (!userid) {
    return res.send({status: 1, msg: '请先登陆'})
  }
  // 根据userid查询对应的user
  UserModel.findOne({_id: userid}, filter)
    .then(user => {
      if (user) {
        res.send({status: 0, data: user})
      } else {
        // 通知浏览器删除userid cookie
        res.clearCookie('userid')
        res.send({status: 1, msg: '请先登陆'})
      }
    })
    .catch(error => {
      console.error('获取用户异常', error)
      res.send({status: 1, msg: '获取用户异常, 请重新尝试'})
    })
})*/

// 获取所有用户列表
router.get("/manage/user/list", (req, res) => {
  UserModel.find({ username: { $ne: "admin" } })
    .then(users => {
      RoleModel.find().then(roles => {
        res.send({ status: 0, data: { users, roles } });
      });
    })
    .catch(error => {
      console.error("get user list error", error);
      res.send({ status: 1, msg: "get user list error, please try again" });
    });
});

// 添加分类
router.post("/manage/category/add", (req, res) => {
  console.log(`add`);
  console.log(req.body);
  const { categoryName, parentId } = req.body;
  CategoryModel.create({ name: categoryName, parentId: parentId || "0" })
    .then(category => {
      res.send({ status: 0, data: category });
    })
    .catch(error => {
      console.error("add category error", error);
      res.send({ status: 1, msg: "add category error, Please try again" });
    });
});

// 获取分类列表
router.get("/manage/category/list", (req, res) => {
  const parentId = req.query.parentId || "0";
  CategoryModel.find({ parentId })
    .then(categorys => {
      res.send({ status: 0, data: categorys });
    })
    .catch(error => {
      console.error(`get categories list error`, error);
      res.send({
        status: 1,
        msg: `get categories list error, Please try again`
      });
    });
});

// 更新分类名称
router.put("/manage/category/update", (req, res) => {
  console.log(req.body);
  const { categoryId, categoryName } = req.body;
  CategoryModel.findOneAndUpdate({ _id: categoryId }, { name: categoryName })
    .then(oldCategory => {
      console.log(`oldCategory`, oldCategory);
      res.send({ status: 0 });
    })
    .catch(error => {
      console.error("update category failed", error);
      res.send({ status: 1, msg: "update category failed, Please try again" });
    });
});

// 根据分类ID获取分类
router.get("/manage/category/info", (req, res) => {
  const categoryId = req.query.categoryId;
  CategoryModel.findOne({ _id: categoryId })
    .then(category => {
      res.send({ status: 0, data: category });
    })
    .catch(error => {
      console.error("get category failed", error);
      res.send({ status: 1, msg: "get category failed, Please try again" });
    });
});

router.delete("/manage/category/delete", (req, res) => {
  console.log(req.body);
  const categoryId = req.body.categoryId;
  CategoryModel.findByIdAndDelete(categoryId)
    .then(deletedCategory => {
      console.log(`deletedCategory`, deletedCategory);
      res.send({ status: 0, data: deletedCategory });
    })
    .catch(error => {
      console.error(error);
      res.send({ status: 1, msg: "delete category failed, Please try again" });
    });
});

// 添加产品
router.post("/manage/product/add", (req, res) => {
  const product = req.body;
  console.log(`product`, product);
  ProductModel.create(product)
    .then(product => {
      res.send({ status: 0, data: product });
    })
    .catch(error => {
      console.error("添加产品异常", error);
      res.send({ status: 1, msg: "添加产品异常, 请重新尝试" });
    });
});

// 获取产品分页列表
router.get("/manage/product/list", (req, res) => {
  const { pageNum, pageSize } = req.query;
  ProductModel.find({})
    .then(products => {
      res.send({ status: 0, data: pageFilter(products, pageNum, pageSize) });
    })
    .catch(error => {
      console.error("get product list error", error);
      res.send({ status: 1, msg: "get product list error, Please try again" });
    });
});

// 搜索产品列表
router.get("/manage/product/search", (req, res) => {
  const { pageNum, pageSize, searchType, searchText } = req.query;
  let contition = {};
  if (searchType === "productName") {
    contition = { name: new RegExp(`^.*${searchText}.*$`) };
  } else if (searchType === `productDesc`) {
    contition = { desc: new RegExp(`^.*${searchText}.*$`) };
  }
  ProductModel.find(contition)
    .then(products => {
      res.send({ status: 0, data: pageFilter(products, pageNum, pageSize) });
    })
    .catch(error => {
      console.error("search product list error", error);
      res.send({
        status: 1,
        msg: "search product list error, Please try again"
      });
    });
});

// 更新产品
router.put("/manage/product/update", (req, res) => {
  const product = req.body;
  console.log(`product`, product);
  ProductModel.findOneAndUpdate({ _id: product._id }, product)
    .then(oldProduct => {
      res.send({ status: 0 });
    })
    .catch(error => {
      console.error("update product error", error);
      res.send({ status: 1, msg: "update product error, Please try again" });
    });
});

// delete product
router.delete("/manage/product/delete", (req, res) => {
  console.log(req.body);
  const productId = req.body.productId;
  ProductModel.findByIdAndDelete(productId)
    .then(deletedProduct => {
      console.log(`deletedCategory`, deletedProduct);
      res.send({ status: 0, data: deletedProduct });
    })
    .catch(error => {
      console.error(error);
      res.send({ status: 1, msg: "delete product failed, Please try again" });
    });
});

// 更新产品状态(上架/下架)
router.put("/manage/product/updateStatus", (req, res) => {
  const { productId, status } = req.body;
  console.log(`req.body`, req.body);
  ProductModel.findOneAndUpdate({ _id: productId }, { status })
    .then(oldProduct => {
      res.send({ status: 0 });
    })
    .catch(error => {
      console.error("update product status error", error);
      res.send({
        status: 1,
        msg: "update product status error, Please try again"
      });
    });
});

router.post("/manage/role/add", (req, res) => {
  const { roleName } = req.body;
  RoleModel.create({ name: roleName })
    .then(role => {
      res.send({ status: 0, data: role });
    })
    .catch(error => {
      console.error("add role error", error);
      res.send({ status: 1, msg: "add role error, Please try again" });
    });
});

// 获取角色列表
router.get("/manage/role/list", (req, res) => {
  RoleModel.find()
    .then(roles => {
      res.send({ status: 0, data: roles });
    })
    .catch(error => {
      console.error("get role list error", error);
      res.send({ status: 1, msg: "get role list error, Please try again" });
    });
});

// 更新角色(设置权限)
router.put("/manage/role/update", (req, res) => {
  const role = req.body;
  console.log(`role`, role);
  role.auth_time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  RoleModel.findOneAndUpdate({ _id: role._id }, role)
    .then(oldRole => {
      // console.log('---', oldRole._doc)
      res.send({ status: 0, data: { ...oldRole._doc, ...role } });
    })
    .catch(error => {
      console.error("update role error", error);
      res.send({ status: 1, msg: "update role error, Please try again" });
    });
});

/*
得到指定数组的分页信息对象
 */
function pageFilter(arr, pageNum, pageSize) {
  pageNum = pageNum * 1;
  pageSize = pageSize * 1;
  const total = arr.length;
  const pages = Math.floor((total + pageSize - 1) / pageSize);
  const start = pageSize * (pageNum - 1);
  const end = start + pageSize <= total ? start + pageSize : total;
  const list = [];
  for (var i = start; i < end; i++) {
    list.push(arr[i]);
  }

  return {
    pageNum,
    total,
    pages,
    pageSize,
    list
  };
}

require("./file-upload")(router);

module.exports = router;
