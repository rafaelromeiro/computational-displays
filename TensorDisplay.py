import numpy as np
from scipy import misc
from scipy.sparse import coo_matrix
from tqdm import tqdm


# Light Field parameters
file_name = './images/bunnies.png'
uv_res = [5, 5]
st_size = [30.0, 48.0]
uv_size = [84.0, 84.0]
spacer = 237.0

# Tensor Display parameters
layer_res = [512, 512]
layer_size = [60.0, 60.0]
layer_spacer = -10.0


# Light Field indices to ray coordinates
img_data = misc.imread(file_name)

uv_res = np.array(uv_res).astype(int)
st_res = img_data.shape[0:2] / uv_res

res = np.array([st_res[0], st_res[1], uv_res[0], uv_res[1]]).astype(int)
size = np.array([st_size[0], st_size[1], uv_size[0], uv_size[1]])

ss, tt, uu, vv = np.mgrid[0:res[0], 0:res[1], 0:res[2], 0:res[3]]
stuv = np.vstack([ss.ravel(), tt.ravel(), uu.ravel(), vv.ravel()])

n = stuv.shape[-1]

img_xx, img_yy = (np.array([[1, 0, res[0], 0], [0, 1, 0, res[1]]]) @ stuv).astype(int)
values = img_data[img_xx, img_yy]

lf_intersections = ((stuv + 0.5) / res.reshape((4, 1)) - 0.5) * size.reshape((4, 1))

origins = lf_intersections[0:2]
directions = (np.array([[-1, 0, 1, 0], [0, -1, 0, 1]]) @ lf_intersections) / spacer


# Ray coordinates to Tensor Display indices
m = layer_res[0] * layer_res[1]

layer_res = np.array(layer_res).reshape((2, 1))
layer_size = np.array(layer_size).reshape((2, 1))

idx_min = np.array([0.0, 0.0]).reshape((2, 1))
idx_max = layer_res - 1.0

layer0_xx, layer0_yy = np.clip(((origins / layer_size) + 0.5) * layer_res, idx_min, idx_max).astype(int)
layer1_xx, layer1_yy = np.clip((((directions * layer_spacer + origins) / layer_size) + 0.5) * layer_res, idx_min, idx_max).astype(int)

layer0_idx = layer0_yy + layer0_xx * layer_res[1]
layer1_idx = layer1_yy + layer1_xx * layer_res[1]

phi0 = coo_matrix((np.ones(n), (np.arange(n), layer0_idx)), shape=(n, m))
phi1 = coo_matrix((np.ones(n), (np.arange(n), layer1_idx)), shape=(n, m))

layer0 = np.random.random((m, 3)) * 255
layer1 = np.random.random((m, 3)) * 255


# Iterations
for i in tqdm(range(20)):
    ltil = (phi0 @ layer0) * (phi1 @ layer1)
    layer0 *= (phi0.T @ (values * (phi1 @ layer1))) / ((phi0.T @ (ltil * (phi1 @ layer1))) + np.finfo(np.float32).eps)
    ltil = (phi0 @ layer0) * (phi1 @ layer1)
    layer1 *= (phi1.T @ (values * (phi0 @ layer0))) / ((phi1.T @ (ltil * (phi0 @ layer0))) + np.finfo(np.float32).eps)

misc.imsave('./images/layer0.png', layer0.reshape((layer_res[0], layer_res[1], 3)))
misc.imsave('./images/layer1.png', layer1.reshape((layer_res[0], layer_res[1], 3)))