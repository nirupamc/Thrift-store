const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
    ],
  },
}

export default config
