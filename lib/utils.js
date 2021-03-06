const humanReadableContentTypes = /^(application\/javascript|application\/json|text\/)/

function isHumanReadable(res) {
  const contentType = res.headers['content-type']
  const contentEncoding = res.headers['content-encoding']
  const identityEncoding = !contentEncoding || contentEncoding === 'identity'

  return identityEncoding && humanReadableContentTypes.test(contentType)
}

function escapeComments(str) {
  return str.replace('/*', '/ *').replace('*/', '* /')
}

module.exports = {
  escapeComments,
  isHumanReadable
}
