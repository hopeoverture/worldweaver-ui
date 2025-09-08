// Workaround for Node.js v22 on Windows returning EISDIR from fs.readlink
// Some tooling (webpack/enhanced-resolve/Next.js) only handles EINVAL/ENOENT
// to mean "not a symlink". Map EISDIR to EINVAL so builds don't crash.
(function applyReadlinkPatch() {
  try {
    const fs = require('fs');

    const origSync = fs.readlinkSync;
    const origAsync = fs.readlink;
    const origPromises = fs.promises && fs.promises.readlink ? fs.promises.readlink.bind(fs.promises) : null;

    fs.readlinkSync = function patchedReadlinkSync(path, options) {
      try {
        return origSync.call(fs, path, options);
      } catch (err) {
        if (err && (err.code === 'EISDIR')) {
          const e = new Error(`EINVAL: invalid argument, readlink '${path}'`);
          e.code = 'EINVAL';
          throw e;
        }
        throw err;
      }
    };

    fs.readlink = function patchedReadlink(path, options, callback) {
      if (typeof options === 'function') {
        callback = options; // eslint-disable-line no-param-reassign
        options = undefined; // eslint-disable-line no-param-reassign
      }
      return origAsync.call(fs, path, options, (err, result) => {
        if (err && err.code === 'EISDIR') {
          const e = new Error(`EINVAL: invalid argument, readlink '${path}'`);
          e.code = 'EINVAL';
          callback && callback(e);
          return;
        }
        callback && callback(err, result);
      });
    };

    if (origPromises) {
      fs.promises.readlink = async function patchedReadlinkPromise(path, options) {
        try {
          return await origPromises(path, options);
        } catch (err) {
          if (err && err.code === 'EISDIR') {
            const e = new Error(`EINVAL: invalid argument, readlink '${path}'`);
            e.code = 'EINVAL';
            throw e;
          }
          throw err;
        }
      };
    }
  } catch (_) {
    // No-op if fs can't be required for some reason.
  }
})();
