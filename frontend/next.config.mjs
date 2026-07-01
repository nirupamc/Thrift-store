const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.onrender.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}

export default config
