import numpy as np
from scipy import misc
from tqdm import trange
from time import perf_counter

target = misc.imread('../images/lenna.png', True) / 255.0
shp = target.shape

radius = 4
W = np.eye(shp[0], shp[1])
for i in range(1, radius+1):
    W += np.eye(shp[0], shp[1], k=i) + np.eye(shp[0], shp[1], k=-i)

misc.imsave('./output/Target.png', target)
misc.imsave('./output/cropped_Target.png', W * target)

t0 = perf_counter()

a_init = np.random.rand(shp[0], 1)
b_init = np.random.rand(shp[1], 1)

init_time = perf_counter() - t0

# Perron vectors (Perron-Frobenius theorem [1907~1912])
print('[Perron-Frobenius]')

t0 = perf_counter()

H1 = target @ target.T
H2 = target.T @ target

eigenvalues, eigenvectors = np.linalg.eigh(H1)
a = eigenvectors[:,-1][np.newaxis].T

eigenvalues, eigenvectors = np.linalg.eigh(H2)
b = eigenvectors[:,-1][np.newaxis].T

t1 = perf_counter()
print('Total: %.5f seconds' % (t1-t0))

misc.imsave('./output/output_Perron.png', a @ b.T)
misc.imsave('./output/a_Perron.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_Perron.png', np.ones(a.shape) @ b.T)

misc.imsave('./output/cropped_Perron.png', W * (a @ b.T))

# Multiplicative iterative method (Lee and Seung [1999])
print('[Lee and Seung]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(20):
    a = a * (target @ b) / (a @ b.T @ b)
    b = b * (target.T @ a) / (b @ a.T @ a)

misc.imsave('./output/output_LeeSeung.png', a @ b.T)
misc.imsave('./output/a_LeeSeung.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_LeeSeung.png', np.ones(a.shape) @ b.T)

# RRI Method (Ho et al. [2007])
print('[RRI]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(20):
    a = (target @ b) / (b.T @ b)
    b = (target.T @ a) / (a.T @ a)

misc.imsave('./output/output_RRI.png', a @ b.T)
misc.imsave('./output/a_RRI.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_RRI.png', np.ones(a.shape) @ b.T)

# Weighted multiplicative iterative method (Blondel et al. [2008])
print('[Blondel]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(20):
    a = a * ((W * target) @ b) / ((W * (a @ b.T)) @ b)
    b = b * ((W.T * target.T) @ a) / ((W.T * (b @ a.T)) @ a)

misc.imsave('./output/output_Blondel.png', a @ b.T)
misc.imsave('./output/a_Blondel.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_Blondel.png', np.ones(a.shape) @ b.T)

misc.imsave('./output/cropped_Blondel.png', W * (a @ b.T))

# WRRI Method (Ho [2008])
print('[WRRI]')

a = a_init
b = b_init

print('Init.: %.5f seconds' % init_time)

for i in trange(20):
    a = ((W * target) @ b) / (W @ (b * b))
    b = ((W.T * target.T) @ a) / (W.T @ (a * a))

misc.imsave('./output/output_WRRI.png', a @ b.T)
misc.imsave('./output/a_WRRI.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_WRRI.png', np.ones(a.shape) @ b.T)

misc.imsave('./output/cropped_WRRI.png', W * (a @ b.T))

# Vectorized multiplicative iterative method (Huang et al. [2015])
print('[Huang]')

a = a_init
b = b_init

t0 = perf_counter()

vec_target = target.reshape((shp[0] * shp[1], 1), order='F')

phi_a = np.kron(np.ones(b.shape), np.eye(shp[0]))
phi_b = np.kron(np.eye(shp[1]), np.ones(a.shape))

t1 = perf_counter()
print('Init.: %.5f seconds' % (t1-t0 + init_time))

for i in trange(20):
    a = a * (phi_a.T @ (vec_target * (phi_b @ b))) / (phi_a.T @ ((phi_a @ a) * (phi_b @ b) * (phi_b @ b)))
    b = b * (phi_b.T @ (vec_target * (phi_a @ a))) / (phi_b.T @ ((phi_b @ b) * (phi_a @ a) * (phi_a @ a)))

misc.imsave('./output/output_Huang.png', a @ b.T)
misc.imsave('./output/a_Huang.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_Huang.png', np.ones(a.shape) @ b.T)