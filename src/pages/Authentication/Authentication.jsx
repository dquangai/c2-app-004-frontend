import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Typography, Space, Divider, message, Breadcrumb, Modal, Grid } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined, HomeOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import './Authentication.css'
import { useAuth } from '../../hooks/useAuth/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../../components/layout/Header/Header'
import Footer from '../../components/layout/Footer/Footer'

const { Title, Text, Link } = Typography
const { useBreakpoint } = Grid

const Authentication = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const screens = useBreakpoint()
  
  const [activeTab, setActiveTab] = useState(location.pathname === '/signup' ? 'register' : 'login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false)
  const [forgotPasswordForm] = Form.useForm()
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)

  // Tự động chuyển tab dựa vào URL
  useEffect(() => {
    if (location.pathname === '/signup') {
      setActiveTab('register')
    } else {
      setActiveTab('login')
    }
  }, [location.pathname])

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      await login(values.email, values.password)
      messageApi.open({ type: 'success', content: 'Đăng nhập thành công!', duration: 3 })
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      message.error(error.message || 'Email hoặc mật khẩu không chính xác, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    const email = values.email.trim().toLowerCase()
    const verifyUrl = `/verify-email?email=${encodeURIComponent(email)}`
    try {
      if (register) {
        await register(email, values.password, values.fullName)
        message.success('Đăng ký thành công! Vui lòng nhập mã OTP trong email.')
        navigate(verifyUrl)
      } else {
        message.error('Tính năng đăng ký tạm thời chưa khả dụng.')
      }
    } catch (error) {
      console.error('Register error:', error)
      const msg = error.message || 'Đăng ký thất bại!'
      const emailTaken =
        /already registered|đã được đăng ký|email đã/i.test(msg)
      if (emailTaken) {
        const notice = 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.'
        registerForm.setFields([{ name: 'email', errors: [notice] }])
        message.error(notice)
        return
      }
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (values) => {
    setForgotPasswordLoading(true)
    try {
      // Dummy logic for now
      setTimeout(() => {
        messageApi.success('Đã gửi email hướng dẫn đặt lại mật khẩu!')
        setForgotPasswordModal(false)
        forgotPasswordForm.resetFields()
        setForgotPasswordLoading(false)
      }, 1000)
    } catch (error) {
      messageApi.error('Có lỗi xảy ra!')
      setForgotPasswordLoading(false)
    }
  }

  const togglePanel = (tab) => {
    setActiveTab(tab)
    navigate(tab === 'login' ? '/login' : '/signup')
  }

  // Animation variants for forms
  const formVariants = {
    login: {
      opacity: activeTab === 'login' ? 1 : 0,
      pointerEvents: activeTab === 'login' ? 'auto' : 'none',
      transition: { duration: 0.4 }
    },
    register: {
      opacity: activeTab === 'register' ? 1 : 0,
      pointerEvents: activeTab === 'register' ? 'auto' : 'none',
      transition: { duration: 0.4 }
    }
  }

  return (
    <div className="auth-page-container">
      <Header />
      {contextHolder}

      <div className="auth-sliding-wrapper">
        {/* Breadcrumb Section overlaying the background image */}
        <div className="auth-breadcrumb-container">
          <div className="auth-breadcrumb-wrapper">
            <Breadcrumb
              separator={<span className="auth-breadcrumb-separator">/</span>}
              items={[
                {
                  title: (
                    <span 
                      className="breadcrumb-nav-item auth-breadcrumb-text" 
                      onClick={() => navigate('/')}
                    >
                      <HomeOutlined /> Trang chủ
                    </span>
                  )
                },
                { 
                  title: (
                    <span 
                      className="breadcrumb-nav-item auth-breadcrumb-text"
                    >
                      {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </span>
                  )
                }
              ]}
            />
          </div>
        </div>

        <div className="auth-box" id="main">

          {/* Sign Up Form Container (Fixed Left Side) */}
          <motion.div
            className="form-container sign-up-container"
            animate={formVariants.register}
            style={{ display: screens.md ? 'block' : (activeTab === 'register' ? 'block' : 'none') }}
          >
            <div className="auth-form-wrapper">
              <Title level={2} className="auth-title">Tạo tài khoản</Title>
              <Text type="secondary" className="auth-subtitle">
                Tham gia cộng đồng Vinhomes thông minh ngay hôm nay
              </Text>

              <Form
                form={registerForm}
                name="register"
                onFinish={handleRegister}
                layout="vertical"
              >
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" className="auth-input" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" className="auth-input" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, min: 8, message: 'Ít nhất 8 ký tự!' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve()
                        return Promise.reject(new Error('Mật khẩu không khớp!'))
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
                </Form.Item>

                <Button type="primary" htmlType="submit" className="auth-main-btn" loading={loading}>
                  Đăng ký
                </Button>
              </Form>

              <div className="auth-footer-text-center">
                <Text type="secondary" className="auth-footer-text">Bạn đã có tài khoản? </Text>
                <Link onClick={() => togglePanel('login')} className="auth-footer-link">Đăng nhập ngay</Link>
              </div>
            </div>
          </motion.div>

          {/* Sign In Form Container (Fixed Right Side) */}
          <motion.div
            className="form-container sign-in-container"
            animate={formVariants.login}
            style={{ display: screens.md ? 'block' : (activeTab === 'login' ? 'block' : 'none') }}
          >
            <div className="auth-form-wrapper">
              <Title level={2} className="auth-title">Đăng nhập</Title>
              <Text type="secondary" className="auth-subtitle-login">
                Chào mừng cư dân quay trở lại
              </Text>

              <Form
                form={loginForm}
                name="login"
                onFinish={handleLogin}
                layout="vertical"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Nhập email" className="auth-input" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                </Form.Item>

                <div className="auth-links-row">
                  <Link onClick={() => togglePanel('register')} className="auth-footer-link-gray">
                    Chưa có tài khoản?
                  </Link>
                  <p className="auth-or-text">hoặc</p>
                  <Link onClick={() => setForgotPasswordModal(true)} className="auth-footer-link-gray">
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button type="primary" htmlType="submit" className="auth-main-btn" loading={loading}>
                  Đăng nhập
                </Button>
              </Form>

              <Divider plain><Text type="secondary" style={{ fontSize: 12 }}>Hoặc</Text></Divider>

              <button className="social-pill" onClick={() => message.info('Google login chưa cấu hình')}>
                <GoogleOutlined style={{ marginRight: 10, color: '#db4437' }} />
                Đăng nhập với Google
              </button>
            </div>
          </motion.div>

          <motion.div
            className="overlay-container"
            animate={{
              x: activeTab === 'register' ? '100%' : '0%',
              scaleX: 1.02,
              z: 0
            }}
            transition={{
              type: 'tween',
              ease: [0.7, 0, 0.3, 1],
              duration: 0.6
            }}
            style={{ willChange: 'transform', transformOrigin: 'left center' }}
          >
            <motion.div
              className="overlay"
              animate={{ x: activeTab === 'register' ? '-50%' : '0%' }}
              transition={{
                type: 'tween',
                ease: [0.7, 0, 0.3, 1],
                duration: 0.6
              }}
              style={{ willChange: 'transform' }}
            >
              {/* Panel 1 (Visible at Login) - Invites to Register */}
              <div className="overlay-panel overlay-left">


                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0, scale: 1.05 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="auth-main-btn overlay-ghost-btn auth-overlay-btn"
                  onClick={(e) => { e.stopPropagation(); togglePanel('register'); }}
                  whileTap={{ scale: 0.95 }}
                >
                  Đăng Ký <ArrowRightOutlined style={{ marginLeft: 8 }} />
                </motion.button>
              </div>

              {/* Panel 2 (Visible at Register) - Invites to Login */}
              <div className="overlay-panel overlay-right" >

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0, scale: 1.05 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="auth-main-btn overlay-ghost-btn auth-overlay-btn"
                  onClick={(e) => { e.stopPropagation(); togglePanel('login'); }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeftOutlined style={{ marginRight: 8 }} /> Đăng Nhập
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

        </div>

        {/* Terms Text overlay on background */}
        <div className="auth-terms-overlay">
          <Text className="auth-terms-text">
            Với việc bạn đã đăng nhập hoặc đã đăng ký, đồng nghĩa với <span className="auth-terms-link">Điều khoản sử dụng</span> và <span className="auth-terms-link">Chính sách bảo mật</span> đã được bạn đọc và đồng ý!
          </Text>
        </div>
      </div>

      <Footer />

      {/* Forgot Password Modal */}
      <Modal
        title={<span className="auth-modal-title">Bạn đã quên mật khẩu?</span>}
        open={forgotPasswordModal}
        onCancel={() => { setForgotPasswordModal(false); forgotPasswordForm.resetFields() }}
        footer={null}
        centered
        width={screens.xs ? '90%' : 480}
      >
        <div className="auth-modal-body">
          <Text type="secondary" className="auth-modal-subtitle">
            Cho chúng mình biết Email của bạn nhé!
          </Text>
          <Form form={forgotPasswordForm} onFinish={handleForgotPassword} layout="vertical">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" size="large" className="auth-input" />
            </Form.Item>

            <Form.Item className="auth-modal-actions">
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => { setForgotPasswordModal(false); forgotPasswordForm.resetFields() }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={forgotPasswordLoading} className="auth-main-btn auth-modal-btn">
                  Gửi email
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}

export default Authentication
