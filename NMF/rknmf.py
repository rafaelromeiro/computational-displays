import numpy as np
from scipy import misc
from tqdm import trange
from time import perf_counter

rank = 100
iterations = 50

target = misc.imread('../images/lenna.png', True) / 255.0
shp = target.shape

radius = 10
W = np.eye(shp[0], shp[1])
for i in range(1, radius+1):
    W += np.eye(shp[0], shp[1], k=i) + np.eye(shp[0], shp[1], k=-i)

misc.imsave('./output/Target.png', target)
misc.imsave('./output/cropped_Target.png', W * target)

t0 = perf_counter()

a_init = np.random.rand(shp[0], rank)
b_init = np.random.rand(shp[1], rank)

init_time = perf_counter() - t0

# Multiplicative iterative method (Lee and Seung [1999])
print('[Lee and Seung]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(iterations):
    a = np.maximum(a * (target @ b) / (a @ b.T @ b), 0.001)
    b = np.maximum(b * (target.T @ a) / (b @ a.T @ a), 0.001)

misc.imsave('./output/output_LeeSeung.png', a @ b.T)
misc.imsave('./output/a_LeeSeung.png', a)
misc.imsave('./output/b_LeeSeung.png', b.T)

# Weighted multiplicative iterative method (Blondel et al. [2008])
print('[Blondel]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(iterations):
    a = np.maximum(a * ((W * target) @ b) / ((W * (a @ b.T)) @ b), 0.001)
    b = np.maximum(b * ((W * target).T @ a) / ((W.T * (b @ a.T)) @ a), 0.001)

misc.imsave('./output/output_Blondel.png', a @ b.T)
misc.imsave('./output/a_Blondel.png', a)
misc.imsave('./output/b_Blondel.png', b.T)

misc.imsave('./output/cropped_Blondel.png', W * (a @ b.T))

# RRI Method (Ho et al. [2007])
print('[RRI]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(iterations):
    for k in range(rank):
        R = target - (a @ b.T) + (a[:, [k]] @ b[:, [k]].T)

        a[:, [k]] = np.maximum((R @ b[:, [k]]) / (b[:, [k]].T @ b[:, [k]]), 0.001)
        b[:, [k]] = np.maximum((R.T @ a[:, [k]]) / (a[:, [k]].T @ a[:, [k]]), 0.001)

misc.imsave('./output/output_RRI.png', a @ b.T)
misc.imsave('./output/a_RRI.png', a)
misc.imsave('./output/b_RRI.png', b.T)

# WRRI Method (Ho [2008])
print('[WRRI]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(iterations):
    for k in range(rank):
        R = target - (a @ b.T) + (a[:, [k]] @ b[:, [k]].T)

        a[:, [k]] = np.maximum(((W * R) @ b[:, [k]]) / (W @ (b[:, [k]] * b[:, [k]])), 0.001)
        b[:, [k]] = np.maximum(((W * R).T @ a[:, [k]]) / (W.T @ (a[:, [k]] * a[:, [k]])), 0.001)

misc.imsave('./output/output_WRRI.png', a @ b.T)
misc.imsave('./output/a_WRRI.png', a)
misc.imsave('./output/b_WRRI.png', b.T)

misc.imsave('./output/cropped_WRRI.png', W * (a @ b.T))